import {
    BadRequestException,
    HttpException,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotAcceptableException,
    NotFoundException,
} from '@nestjs/common';
import { ErrorType } from '@common/enums';
import { InvalidCredentialsException, DisabledUserException, NotFoundUserException } from '@common/http/exceptions';
import { omit } from 'lodash';
import { AuthCredentialsRequestDto, RegisterResponseDto, AuthRegisterRequestDto } from '../dtos';
import { TokenService } from './token.service';
import { HashHelper, TimeHelper } from '@helpers';
import { RegisterResponseDtoBuilder } from '../dtos/register-response.dto';
import { AccountRepository } from '../repositories';
import { UserService } from '@modules/user/service/user.service';
import { RedisCommander } from 'ioredis';
import { LoginResponseDtoBuilder } from '../dtos/login-response.dto';
import { AccountEntity, UserStatus } from '@database/entities/account.entity';
import { RefreshTokenResponseDtoBuilder } from '../dtos/refresh-token-response.dto';
import { MailSenderService } from '@src/mail/mail.service';
import * as crypto from 'crypto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { JwtPayload } from '@common/dtos';
import { AuthErrorType, UserErrorType } from '@common/errors';
import { Role } from '../decorators/roles.decorator';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';

@Injectable()
export class AuthService {
    constructor(
        protected readonly tokenService: TokenService,
        protected readonly accountRepository: AccountRepository,
        protected readonly userService: UserService,
        protected readonly mailService: MailSenderService,
        @Inject('CACHE_INSTANCE') protected readonly redisCache: RedisCommander
    ) {}

    protected async findOne(
        email: string,
        provider?: { name: 'google' | 'facebook'; id: string }
    ): Promise<AccountEntity> {
        const condition = provider ? { email: email, [`${provider.name}Id`]: provider.id } : { email: email };
        return await this.accountRepository.findOne({
            where: condition,
            relations: {
                profile: true,
                enterprise: true,
            },
        });
    }

    protected async findOneById(accountId: string): Promise<AccountEntity> {
        return await this.accountRepository.findOne({
            where: { accountId },
            relations: {
                profile: true,
                enterprise: true,
            },
        });
    }

    protected getDisabledAccountRestriction(account: AccountEntity) {
        if (account.status === UserStatus.BLOCKED) {
            return new DisabledUserException(ErrorType.BlockedUser);
        }
        if (account.status === UserStatus.PENDING) {
            return new DisabledUserException(ErrorType.PendingUSer);
        }
        if (account.status === UserStatus.INACTIVE) {
            return new DisabledUserException(ErrorType.InactiveUser);
        }
        return null;
    }

    public async login({ username, password }: AuthCredentialsRequestDto) {
        try {
            const account = await this.findOne(username);

            if (!account) {
                throw new NotFoundUserException();
            }

            // restrict disabled user
            const restriction = this.getDisabledAccountRestriction(account);
            if (restriction) {
                throw restriction;
            }

            const passwordMatch = await HashHelper.compare(password, account.password);
            if (!passwordMatch) {
                throw new InvalidCredentialsException();
            }

            const userPayload = omit(account, ['password', 'active']);
            const payload: JwtPayload = {
                accountId: userPayload.accountId,
                roles: userPayload.roles,
                profileId: userPayload.profile.profileId,
                enterpriseId: userPayload.enterprise?.enterpriseId || null,
            };

            const token = await this.tokenService.generateAuthToken(payload);
            await this.storeRefreshTokenOnCache(
                userPayload.accountId,
                token.refreshToken,
                token.refreshTokenExpires / 1000
            );

            const { refreshToken, refreshTokenExpires, ...tokenWithoutRefreshToken } = token;

            return {
                builder: new LoginResponseDtoBuilder()
                    .setValue({
                        ...tokenWithoutRefreshToken,
                        refreshTokenExpires,
                    })
                    .success()
                    .build(),
                refreshToken,
                refreshTokenExpires,
            };
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async register({
        username,
        password,
        email,
        full_name,
    }: AuthRegisterRequestDto): Promise<RegisterResponseDto> {
        try {
            if (await this.accountRepository.count({ where: { email } })) {
                return new RegisterResponseDtoBuilder()
                    .setMessageCode('AUTH_REGISTER_EMAIL_EXISTS')
                    .setCode(400)
                    .build();
            }
            const hashedPassword = await HashHelper.encrypt(password);

            const account = await this.accountRepository.save({
                email,
                password: hashedPassword,
                status: UserStatus.PENDING,
                role: ['USER'],
                isActive: false,
            });

            const verificationCode = this.generateVerificationCode();

            Promise.allSettled([
                this.userService.createUser({ fullName: full_name, account: account.accountId }),
                this.sendVerificationEmail(username, email, verificationCode),
                this.redisCache.set(`verify:${email}`, verificationCode, 'EX', 300),
            ]);

            return new RegisterResponseDtoBuilder().setValue(account).success().build();
        } catch (error) {
            console.error('Registration error:', error);
            return new RegisterResponseDtoBuilder().badRequest().build();
        }
    }

    public async refreshToken(payload: JwtPayload, refreshToken: string) {
        try {
            const { roles, profile, enterprise } = await this.accountRepository
                .createQueryBuilder('account')
                .leftJoin('account.profile', 'profile')
                .leftJoin('account.enterprise', 'enterprise')
                .select(['account.roles', 'profile.profileId', 'enterprise.enterpriseId'])
                .where('account.accountId = :accountId AND account.status = :status', {
                    accountId: payload.accountId,
                    status: UserStatus.ACTIVE,
                })
                .getOne();

            const {
                accessToken,
                accessTokenExpires,
                refreshToken: newRefreshToken,
                refreshTokenExpires,
                tokenType,
            } = await this.tokenService.generateAuthToken({
                accountId: payload.accountId,
                roles: roles,
                profileId: profile.profileId,
                enterpriseId: enterprise?.enterpriseId,
            });

            // store new fresh token to redis
            await this.storeRefreshTokenOnCache(payload.accountId, newRefreshToken, refreshTokenExpires / 1000); // convert to seconds
            // delete old refresh token from redis
            await this.deleteRefreshTokenOnCache(payload.accountId, refreshToken);

            return {
                builder: new RefreshTokenResponseDtoBuilder()
                    .setValue({
                        accessToken,
                        accessTokenExpires,
                        tokenType,
                        refreshTokenExpires,
                    })
                    .success()
                    .build(),
                refreshToken: newRefreshToken,
                refreshTokenExpires,
            };
        } catch (error) {
            console.error(error);
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    protected async storeRefreshTokenOnCache(accountId: string, refreshToken: string, expiresInSeconds: number) {
        try {
            const payload = this.tokenService.decodeToken(refreshToken);
            await this.redisCache.set(`refreshtoken:${accountId}:${payload.jit}`, 1, 'EX', expiresInSeconds);
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }

    protected async deleteRefreshTokenOnCache(accountId: string, refreshToken: string) {
        try {
            const payload = this.tokenService.decodeToken(refreshToken);
            return await this.redisCache.del(`refreshtoken:${accountId}:${payload.jit}`);
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }

    public sendCodeToVerifyEmail({ username, email, code }) {
        try {
            this.mailService.sendVerifyEmailMail(username, email, code);
            return;
        } catch (error) {
            throw false;
        }
    }

    public async verifyEmailCode({ email, code }) {
        try {
            let account = await this.accountRepository.findOne({ where: { email, status: UserStatus.PENDING } });

            const verifyCode = await this.redisCache.get(`verify:${email}`);
            if (+verifyCode === +code) {
                await this.accountRepository.update({ email }, { isActive: true });
                await this.accountRepository.update({ email }, { status: UserStatus.ACTIVE });
                await this.userService.activeProfile(account.accountId);
                await this.redisCache.del(`verify:${email}`);
                return new RegisterResponseDtoBuilder().success().build();
            }
            return new RegisterResponseDtoBuilder().setMessageCode('AUTH_VERIFY_CODE_INVALID').setCode(400).build();
        } catch (error) {
            throw new RegisterResponseDtoBuilder().badRequest().build();
        }
    }

    public async resendEmailCode({ email }: { email: string }) {
        try {
            await this.redisCache.del(`verify:${email}`);
            const account = await this.accountRepository.findOne({ where: { email } });
            if (!account) {
                return new RegisterResponseDtoBuilder()
                    .setMessageCode('AUTH_REGISTER_EMAIL_NOT_EXISTS')
                    .setCode(400)
                    .build();
            }

            if (account.status === UserStatus.ACTIVE) {
                return new RegisterResponseDtoBuilder()
                    .setMessageCode('AUTH_ACCOUNT_ALREADY_ACTIVE')
                    .setCode(400)
                    .build();
            }
            if (account.status === UserStatus.BLOCKED) {
                return new RegisterResponseDtoBuilder().setMessageCode('AUTH_ACCOUNT_BLOCKED').setCode(400).build();
            }

            const profile = await this.userService.getUserByAccountId(account.accountId);
            if (!profile) {
                return new RegisterResponseDtoBuilder().setMessageCode('PROFILE_NOT_EXISTS').setCode(400).build();
            }

            const verificationCode = this.generateVerificationCode();
            await Promise.allSettled([
                this.sendCodeToVerifyEmail({ username: profile.fullName, email, code: verificationCode }),
                this.redisCache.set(`verify:${email}`, verificationCode, 'EX', 300),
            ]);

            return new RegisterResponseDtoBuilder().success().build();
        } catch (error) {
            console.error('Error in resendEmailCode:', error);
            throw new RegisterResponseDtoBuilder().badRequest().build();
        }
    }
    protected generateVerificationCode(): number {
        return Math.floor(100000 + Math.random() * 900000);
    }
    protected async sendVerificationEmail(username: string, email: string, code: number) {
        try {
            await this.mailService.sendVerifyEmailMail(username, email, code);
        } catch (error) {
            throw new InternalServerErrorException('Email sending failed');
        }
    }
    public async validateAndDelRefreshToken(accountId: string, refreshToken: string): Promise<boolean> {
        const payload = this.tokenService.decodeToken(refreshToken);
        const exists = await this.redisCache.get(`refreshtoken:${accountId}:${payload.jit}`);
        if (exists) await this.redisCache.del(`refreshtoken:${accountId}:${payload.jit}`);
        return !!exists;
    }

    public async getMe(user: JwtPayload): Promise<RegisterResponseDto | null> {
        try {
            let result = {} as any;
            if (user.accountId) {
                result = await this.userService.getUserByAccountId(user.accountId);
            }

            return new RegisterResponseDtoBuilder().setValue(result).success().build();
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }

    public async forgetPassword({ email }: { email: string }) {
        try {
            const user = await this.accountRepository
                .createQueryBuilder('account')
                .leftJoin('account.profile', 'profile')
                .select(['account.email', 'profile.fullName', 'account.status']) // Chỉ lấy email và fullName
                .where('account.email = :email', { email })
                .getOne();

            if (!user) {
                throw new NotFoundException(AuthErrorType.EMAIL_NOT_EXISTS);
            }

            if (user?.status !== UserStatus.ACTIVE) {
                throw new NotAcceptableException(AuthErrorType.USER_NOT_ACTIVE);
            }

            const expiredInMilliseconds = TimeHelper.shorthandToMs(process.env.RESET_PASSWORD_TOKEN_EXPIRES);
            const token = crypto.randomBytes(32).toString('hex');
            const expired = new Date(Date.now() + expiredInMilliseconds);

            const { encryptedData: resetToken, iv } = HashHelper.encode([token, expired].join(','));

            Promise.allSettled([
                this.redisCache.set(`forget-password:${email}`, token, 'EX', expiredInMilliseconds / 1000),
                this.mailService.sendResetPasswordMail(user.profile.fullName, email, resetToken, iv),
            ]);

            return new RegisterResponseDtoBuilder().success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async resetPassword({ newPassword, token, email, iv }: ResetPasswordDto) {
        try {
            // decode reset token
            let decodedToken = HashHelper.decode(token, iv);

            if (!decodedToken) {
                throw new NotAcceptableException(AuthErrorType.NOT_ALLOW_RESET_PW);
            }

            const [baseToken, expires] = decodedToken.split(',');
            // check token still lives
            if (isNaN(new Date(expires).getTime()) || new Date(expires).getTime() <= Date.now()) {
                throw new NotAcceptableException(AuthErrorType.TOKEN_EXPIRED);
            }

            // check token is valid on cache
            const storedToken = await this.redisCache.get(`forget-password:${email}`);
            if (!storedToken || storedToken !== baseToken) {
                throw new NotAcceptableException(AuthErrorType.NOT_ALLOW_RESET_PW);
            }

            // delete cache after comparing
            this.redisCache.del(`forget-password:${email}`);

            const hashedPassword = await HashHelper.encrypt(newPassword);
            await this.accountRepository.update({ email: email }, { password: hashedPassword });

            return new RegisterResponseDtoBuilder().success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async logout(refreshToken: string, accountId: string) {
        try {
            const isDeleted = await this.deleteRefreshTokenOnCache(refreshToken, accountId);
            if (isDeleted) {
                return new RegisterResponseDtoBuilder().setValue(true).success().build();
            } else {
                return new RegisterResponseDtoBuilder().badRequestContent(ErrorType.InvalidCredentials).build();
            }
        } catch (error) {
            throw new RegisterResponseDtoBuilder().setValue(true).success().build();
        }
    }
}
