import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ErrorType } from '@common/enums';
import { InvalidCredentialsException, DisabledUserException, NotFoundUserException } from '@common/http/exceptions';
import { omit } from 'lodash';
import { AuthCredentialsRequestDto, JwtPayload, RegisterResponseDto, AuthRegisterRequestDto } from '../dtos';
import { TokenService } from './token.service';
import { HashHelper } from '@helpers';
import { RegisterResponseDtoBuilder } from '../dtos/register-response.dto';
import { AccountRepository } from '../repositories';
import { UserService } from '@modules/user/service/user.service';
import { RedisCommander } from 'ioredis';
import { LoginResponseDtoBuilder } from '../dtos/login-response.dto';
import { UserStatus } from '@database/entities/account.entity';
import { RefreshTokenResponseDtoBuilder } from '../dtos/refresh-token-response.dto';
import { MailSenderService } from 'src/mail/mail.service';
import * as crypto from 'crypto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly tokenService: TokenService,
        private readonly accountRepository: AccountRepository,
        private readonly userService: UserService,
        private readonly mailService: MailSenderService,
        @Inject('CACHE_INSTANCE') private readonly redisCache: RedisCommander
    ) {}

    public async login({ username, password }: AuthCredentialsRequestDto) {
        try {
            const account = await this.accountRepository.findOne({ where: { email: username } });
            if (!account) {
                throw new NotFoundUserException(ErrorType.NotFoundUserException);
            }
            const passwordMatch = await HashHelper.compare(password, account.password);
            if (!passwordMatch) {
                throw new InvalidCredentialsException();
            }

            if (account.status === UserStatus.BLOCKED) {
                throw new DisabledUserException(ErrorType.BlockedUser);
            }
            if (account.status === UserStatus.PENDING) {
                throw new DisabledUserException(ErrorType.PendingUSer);
            }
            if (account.status === UserStatus.INACTIVE) {
                throw new DisabledUserException(ErrorType.InactiveUser);
            }

            const userPayload = omit(account, ['password', 'active']);

            const payload: JwtPayload = {
                accountId: userPayload.accountId,
                roles: userPayload.roles,
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
                        user: userPayload,
                    })
                    .success()
                    .build(),
                refreshToken,
                refreshTokenExpires,
            };
        } catch (error) {
            throw new LoginResponseDtoBuilder().badRequestContent(error.response.errorType).build();
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
            if (!(await this.validateRefreshToken(payload.accountId, refreshToken))) {
                throw new InvalidCredentialsException();
            }

            const roles = [];
            const {
                accessToken,
                accessTokenExpires,
                refreshToken: newRefreshToken,
                refreshTokenExpires,
                tokenType,
            } = this.tokenService.generateAuthToken({ accountId: payload.accountId, roles: roles });

            // store new fresh token to redis
            await this.storeRefreshTokenOnCache(payload.accountId, newRefreshToken, refreshTokenExpires / 1000); // convert to seconds

            return {
                builder: new RefreshTokenResponseDtoBuilder()
                    .setValue({
                        accessToken,
                        accessTokenExpires,
                        tokenType,
                    })
                    .success()
                    .build(),
                refreshToken: newRefreshToken,
                refreshTokenExpires,
            };
        } catch (error) {
            throw new RefreshTokenResponseDtoBuilder().badRequest().build();
        }
    }

    private async storeRefreshTokenOnCache(accountId: string, refreshToken: string, expiresInSeconds: number) {
        try {
            await this.redisCache.set(`refreshtoken:${accountId}:${refreshToken}`, 1, 'EX', expiresInSeconds);
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }

    private async deleteRefreshTokenOnCache(accountId: string, refreshToken: string) {
        try {
            return await this.redisCache.del(`refreshtoken:${accountId}:${refreshToken}`);
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
    private generateVerificationCode(): number {
        return Math.floor(100000 + Math.random() * 900000);
    }
    private async sendVerificationEmail(username: string, email: string, code: number) {
        try {
            await this.mailService.sendVerifyEmailMail(username, email, code);
        } catch (error) {
            throw new InternalServerErrorException('Email sending failed');
        }
    }
    private async validateRefreshToken(accountId: string, refreshToken: string): Promise<boolean> {
        const exists = await this.redisCache.get(`refreshtoken:${accountId}:${refreshToken}`);
        if (exists) await this.redisCache.del(`refreshtoken:${accountId}:${refreshToken}`);
        return Boolean(exists);
    }
    public async getMe(accountId: string): Promise<RegisterResponseDto | null> {
        try {
            return new RegisterResponseDtoBuilder()
                .setValue(await this.userService.findUserByAccountId(accountId))
                .success()
                .build();
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }

    public async forgetPassword({ email }: { email: string }) {
        try {
            const user = await this.accountRepository
                .createQueryBuilder('account')
                .leftJoin('account.profile', 'profile')
                .select(['account.email', 'profile.fullName']) // Chỉ lấy email và fullName
                .where('account.email = :email', { email })
                .getOne();

            if (!user) {
                return new RegisterResponseDtoBuilder().badRequestContent('EMAIL_NOT_EXIST').build();
            }

            const token = crypto.randomBytes(32).toString('hex');
            const url = `${process.env.CLIENT_URL}/reset-password/${token}`;
            Promise.allSettled([
                this.redisCache.set(`forget-password:${email}`, token, 'EX', 5 * 60),
                this.mailService.sendResetPasswordMail(user.profile.fullName, email, token),
            ]);

            return new RegisterResponseDtoBuilder().success().build();
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }

    public async resetPassword({ newPassword, token, email }: ResetPasswordDto) {
        try {
            const storedToken = await this.redisCache.get(`forget-password:${email}`);
            if (!storedToken || storedToken !== token) {
                return new RegisterResponseDtoBuilder().badRequestContent('NOT_ALLOW').build();
            }

            // delete cache after comparing
            await this.redisCache.del(`forget-password:${email}`);

            const hashedPassword = await HashHelper.encrypt(newPassword);
            await this.accountRepository.update({ email: email }, { password: hashedPassword });

            return new RegisterResponseDtoBuilder().success().build();
        } catch (error) {
            throw new InternalServerErrorException();
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
