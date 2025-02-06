import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ErrorType } from '@common/enums';
import { InvalidCredentialsException, DisabledUserException } from '@common/http/exceptions';
import { UserStatus } from '@admin/access/users/user-status.enum';
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
import { UserEntity } from '@modules/admin/access/users/user.entity';
import { Cacheable } from 'cacheable';
import { RoleService } from '@modules/role/service/role.service';
import { ConfigService } from '@nestjs/config';
export enum AccountStatusType {
    ACTIVE = 'ACTIVE',
    PENDING = 'PENDING',
    INACTIVE = 'INACTIVE',
}
@Injectable()
export class AuthService {
    constructor(
        private readonly tokenService: TokenService,
        private readonly accountRepository: AccountRepository,
        private readonly userService: UserService,
        private readonly roleService: RoleService,
        private readonly configService: ConfigService,
        @Inject('CACHE_INSTANCE') private readonly cacheInstance: Cacheable
    ) {}

    /**
     * User authentication
     * @param authCredentialsDto {AuthCredentialsRequestDto}
     * @returns {Promise<LoginResponseDto>}
     */
    public async login({ username, password }: AuthCredentialsRequestDto): Promise<LoginResponseDto> {
        const user = hardcodedUsers.find((u) => u.username === username);
        if (!user) {
            throw new InvalidCredentialsException();
        }

        const passwordMatch = await HashHelper.compare(password, user.password);
        if (!passwordMatch) {
            throw new InvalidCredentialsException();
        }

        if (user.status === UserStatus.Blocked) {
            throw new DisabledUserException(ErrorType.BlockedUser);
        }
        if (user.status === UserStatus.Inactive) {
            throw new DisabledUserException(ErrorType.InactiveUser);
        }

        const userPayload = omit(user, ['password', 'active']);
        const payload: JwtPayload = {
            accountId: userPayload.id,
            roles: ['CANDIDATE', 'ENTERPRISE'],
        };

        const token = await this.tokenService.generateAuthToken(payload);
        return {
            user: userPayload,
            token,
            access: {
                roles: user.roles.map((role) => ({ name: role })),
            },
        };
        // return {} as LoginResponseDto;
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

            let role = await this.roleService.getRoleByName('USER');
            if (!role) {
                role = await this.roleService.createRole('USER');
            }
            let account: AccountEntity = await this.accountRepository.save({
                email: email,
                password: hashedPassword,
                status: AccountStatusType.PENDING,
                role,
                isActive: false,
            });
            const user: CreateUserDto = {
                fullName: full_name, // Ensure full name is assigned
                account: account.accountId,
            };
            await this.userService.createUser(user);
            return new RegisterResponseDtoBuilder().setValue(account).success().build();
        } catch (error) {
            console.error('Error registering user:', error);
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
            console.error('Error fetching account by email:', error);
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
            console.error('Error refresh token:', error);
            throw new InternalServerErrorException();
        }
    }

    private async storeRefreshTokenOnCache(accountId: string, refreshToken: string) {
        try {
            const expiresIn = this.configService.get('REFRESH_TOKEN_EXPIRES_IN');
            await this.cacheInstance.set(`refreshtoken:${accountId}:${refreshToken}`, 1, expiresIn);
        } catch (error) {
            console.log('Store refresh token failed: ' + error);
            throw new InternalServerErrorException();
        }
    }

    private async validateRefreshTokenOnCache(accountId: string, refreshToken: string) {
        try {
            const existedRefreshToken = await this.cacheInstance.get(`refreshtoken:${accountId}:${refreshToken}`);

            if (existedRefreshToken) await this.deleteRefreshTokenOnCache(accountId, refreshToken);

            return existedRefreshToken;
        } catch (error) {
            console.log('Validate refresh token failed: ' + error);
            throw new InternalServerErrorException();
        }
    }

    private async deleteRefreshTokenOnCache(accountId: string, refreshToken: string) {
        try {
            await this.cacheInstance.delete(`refreshtoken:${accountId}:${refreshToken}`);
        } catch (error) {
            console.log('Delete refresh token failed: ' + error);
            throw new InternalServerErrorException();
        }
    }
}
