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
import { AccountEntity, ProfileEntity } from '@database/entities';
import { CreateUserDto } from '@modules/user/dtos';
import { Cacheable } from 'cacheable';
import { ConfigService } from '@nestjs/config';
import { LoginResponseDtoBuilder } from '../dtos/login-response.dto';
import { UserStatus } from '@database/entities/account.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly tokenService: TokenService,
        private readonly accountRepository: AccountRepository,
        private readonly userService: UserService,
        private readonly configService: ConfigService,
        @Inject('CACHE_INSTANCE') private readonly cacheInstance: Cacheable
    ) {}

    /**
     * User authentication
     * @param authCredentialsDto {AuthCredentialsRequestDto}
     * @returns {Promise<LoginResponseDto>}
     */
    public async login({ username, password }: AuthCredentialsRequestDto): Promise<any> {
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
                throw new DisabledUserException(ErrorType.InactiveUser);
            }

            const userPayload = omit(account, ['password', 'active']);

            const payload: JwtPayload = {
                accountId: userPayload.accountId,
                roles: userPayload.roles,
            };

            const token = await this.tokenService.generateAuthToken(payload);
            return new LoginResponseDtoBuilder()
                .setValue({
                    ...token,
                    user: userPayload,
                })
                .success()
                .build();
        } catch (error) {
            return new LoginResponseDtoBuilder().badRequestContent(error.response.errorType).build();
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
            const existingAccount = await this.getAccountByEmail(email);
            if (existingAccount.length > 0) {
                return new RegisterResponseDtoBuilder()
                    .setMessageCode('AUTH_REGISTER_EMAIL_EXISTS')
                    .setCode(400)
                    .build();
            }

            const hashedPassword = await HashHelper.encrypt(password);

            let account: AccountEntity = await this.accountRepository.save({
                email: email,
                password: hashedPassword,
                status: UserStatus.PENDING,
                role: ['USER'],
                isActive: false,
            });
            const user: CreateUserDto = {
                fullName: full_name, // Ensure full name is assigned
                account: account.accountId,
            };
            await this.userService.createUser(user);
            return new RegisterResponseDtoBuilder().setValue(account).success().build();
        } catch (error) {
            return new RegisterResponseDtoBuilder().badRequest().build();
        }
    }

    /**
     * Get account by email
     * @param email {string}
     * @returns {Promise<any>}
     */
    private async getAccountByEmail(email: string) {
        try {
            return await this.accountRepository.find({ where: { email } });
        } catch (error) {
            return [];
        }
    }

    public async refreshToken(payload: JwtPayload, refreshToken: string) {
        try {
            const validRefreshToken = await this.validateRefreshTokenOnCache(payload.accountId, refreshToken);

            if (!validRefreshToken) {
                throw new InvalidCredentialsException();
            }

            const roles = [];
            // fetch roles of user
            // code later........

            // generate new token
            const {
                accessToken,
                accessTokenExpires,
                refreshToken: newRefreshToken,
                tokenType,
            } = this.tokenService.generateAuthToken({ accountId: payload.accountId, roles: roles });

            // store new fresh token to redis
            await this.storeRefreshTokenOnCache(payload.accountId, newRefreshToken);

            return {
                accessToken,
                accessTokenExpires,
                refreshToken: newRefreshToken,
                tokenType,
            };
            return { accessToken, accessTokenExpires, refreshToken: newRefreshToken, tokenType };
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }

    private async storeRefreshTokenOnCache(accountId: string, refreshToken: string) {
        try {
            const expiresIn = this.configService.get('REFRESH_TOKEN_EXPIRES_IN');
            await this.cacheInstance.set(`refreshtoken:${accountId}:${refreshToken}`, 1, expiresIn);
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }

    private async validateRefreshTokenOnCache(accountId: string, refreshToken: string) {
        try {
            const existedRefreshToken = await this.cacheInstance.get(`refreshtoken:${accountId}:${refreshToken}`);

            if (existedRefreshToken) await this.deleteRefreshTokenOnCache(accountId, refreshToken);

            return existedRefreshToken;
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }

    private async deleteRefreshTokenOnCache(accountId: string, refreshToken: string) {
        try {
            await this.cacheInstance.delete(`refreshtoken:${accountId}:${refreshToken}`);
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }
}
