// import { UsersRepository } from '@modules/admin/access/users/users.repository';
import { Injectable, Logger } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
    RefreshTokenExpiredException,
    AccessTokenExpiredException,
    InvalidTokenException,
} from '../../../common/http/exceptions';
import { ValidateTokenResponseDto, JwtPayload, TokenDto } from '../dtos';
import { TokenError, TokenType } from '../enums';
import { UserStatus } from '@database/entities/account.entity';
import { TimeHelper } from 'src/helpers/time.helper';

@Injectable()
export class TokenService {
    constructor(
        // @InjectRepository(UsersRepository)
        // private usersRepository: UsersRepository,
        private jwtService: JwtService,
        private configService: ConfigService
    ) {}

    /**
     * Generate Auth token(JWT) service for login user
     * @param JwtPayload {JwtPayload}
     * @returns TokenDto Returns access and refresh tokens with expiry
     */
    public generateAuthToken(payload: JwtPayload): TokenDto {
        const accessTokenExpires = this.configService.get('ACCESS_TOKEN_EXPIRES_IN');
        const refreshTokenExpires = this.configService.get('REFRESH_TOKEN_EXPIRES_IN');

        const accessTokenExpiresInMilliSeconds = TimeHelper.shorthandToMs(accessTokenExpires);
        const refreshTokenExpiresInMilliSeconds = TimeHelper.shorthandToMs(refreshTokenExpires);

        const accessTokenSecret = this.configService.get('ACCESS_TOKEN_SECRET');
        const refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET');
        const tokenType = this.configService.get('TOKEN_TYPE');
        const accessToken = this.generateToken(payload, accessTokenExpiresInMilliSeconds / 1000, accessTokenSecret);
        const refreshToken = this.generateToken(payload, refreshTokenExpiresInMilliSeconds / 1000, refreshTokenSecret);

        return {
            tokenType,
            accessToken,
            accessTokenExpires: accessTokenExpiresInMilliSeconds,
            refreshToken,
            refreshTokenExpires: refreshTokenExpiresInMilliSeconds,
        };
    }

    /**
     * Verify JWT service
     * @param token JWT token
     * @param type {TokenType} "refresh" or "access"
     * @returns decrypted payload from JWT
     */
    public verifyToken(token: string, type: TokenType) {
        try {
            return this.jwtService.verify(token);
        } catch ({ name }) {
            if (name == TokenError.TokenExpiredError && type == TokenType.AccessToken) {
                throw new AccessTokenExpiredException();
            }
            if (name == TokenError.TokenExpiredError && type == TokenType.RefreshToken) {
                throw new RefreshTokenExpiredException();
            }
            throw new InvalidTokenException();
        }
    }

    /**
     * Validate received JWT
     * @param token {string}
     * @returns valid: boolean
     */
    public async validateToken(token: string): Promise<ValidateTokenResponseDto> {
        try {
            const { id } = this.jwtService.verify(token);
            const user: any = { id: 1, status: UserStatus.ACTIVE };
            if (!user || user.status == UserStatus.BLOCKED || user.status == UserStatus.INACTIVE) {
                return { valid: false };
            }

            return { valid: !!id };
        } catch (error) {
            Logger.error('Validation token error', error);
            return { valid: false };
        }
    }

    /**
     * Generate JWT token
     * @private
     * @param payload {JwtPayload}
     * @param expiresIn {string}
     * @returns JWT
     */
    private generateToken(payload: JwtPayload, expiresInSeconds: number, secretKey: string): string {
        const token = this.jwtService.sign(payload, { expiresIn: expiresInSeconds, secret: secretKey });
        return token;
    }
}
