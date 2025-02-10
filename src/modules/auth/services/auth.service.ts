import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ErrorType } from '@common/enums';
import { InvalidCredentialsException, DisabledUserException, NotFoundUserException } from '@common/http/exceptions';
import { omit } from 'lodash';
import {
    AuthCredentialsRequestDto,
    LoginResponseDto,
    JwtPayload,
    RegisterResponseDto,
    AuthRegisterRequestDto,
} from '../dtos';
import { TokenService } from './token.service';
import { HashHelper } from '@helpers';
import { hardcodedUsers } from '../mocks/indentify-user.mock';
import { RegisterResponseDtoBuilder } from '../dtos/register-response.dto';
import { AccountRepository } from '../repositories';
import { UserService } from '@modules/user/service/user.service';
import { AccountEntity } from '@database/entities';
import { CreateUserDto } from '@modules/user/dtos';
import { RedisCommander } from 'ioredis';

export enum AccountStatusType {
    ACTIVE = 'ACTIVE',
    PENDING = 'PENDING',
    INACTIVE = 'INACTIVE',
}
import { LoginResponseDtoBuilder } from '../dtos/login-response.dto';
import { UserStatus } from '@database/entities/account.entity';
import { RefreshTokenResponseDtoBuilder } from '../dtos/refresh-token-response.dto';
import { MailSenderService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly tokenService: TokenService,
        private readonly accountRepository: AccountRepository,
        private readonly userService: UserService,
        private readonly mailService: MailSenderService,
        @Inject('CACHE_INSTANCE') private readonly redisCache: RedisCommander
    ) {}

    /**
     * User authentication
     * @param authCredentialsDto {AuthCredentialsRequestDto}
     * @returns {Promise<LoginResponseDto>}
     */
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

    /**
     * User registration
     * @param authRegisterDto {AuthRegisterRequestDto}
     * @returns {Promise<RegisterResponseDto>}
     */
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

    private async validateRefreshTokenOnCache(accountId: string, refreshToken: string) {
        try {
            const existedRefreshToken = await this.redisCache.get(`refreshtoken:${accountId}:${refreshToken}`);

            if (existedRefreshToken) await this.deleteRefreshTokenOnCache(accountId, refreshToken);

            return existedRefreshToken;
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
}
