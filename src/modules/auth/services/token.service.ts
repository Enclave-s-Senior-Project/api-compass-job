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
import { ValidateTokenResponseDto, TokenDto } from '../dtos';
import { TokenError, TokenType } from '../enums';
import { UserStatus } from '@database/entities/account.entity';
import { TimeHelper } from '@helpers';
import { JwtPayload } from '@common/dtos';
import { v4 as uuidv4 } from 'uuid';

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
    public async generateAuthToken(payload: JwtPayload): Promise<TokenDto> {
        const accessTokenExpires = this.configService.get('ACCESS_TOKEN_EXPIRES_IN');
        const refreshTokenExpires = this.configService.get('REFRESH_TOKEN_EXPIRES_IN');

        const accessTokenExpiresInMilliSeconds = TimeHelper.shorthandToMs(accessTokenExpires);
        const refreshTokenExpiresInMilliSeconds = TimeHelper.shorthandToMs(refreshTokenExpires);

        const accessTokenSecret = this.configService.get('ACCESS_TOKEN_SECRET');
        const refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET');
        const tokenType = this.configService.get('TOKEN_TYPE');
        const accessToken = await this.generateToken(
            payload,
            accessTokenExpiresInMilliSeconds / 1000,
            accessTokenSecret
        );
        const refreshToken = await this.generateToken(
            payload,
            refreshTokenExpiresInMilliSeconds / 1000,
            refreshTokenSecret
        );

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
     * Generate JWT token
     * @private
     * @param payload {JwtPayload}
     * @param expiresIn {string}
     * @returns JWT
     */
    private async generateToken(payload: JwtPayload, expiresInSeconds: number, secretKey: string): Promise<string> {
        const token = await this.jwtService.signAsync(
            { ...payload, jit: uuidv4() },
            { expiresIn: expiresInSeconds, secret: secretKey }
        );
        return token;
    }

    public decodeToken(token: string) {
        return this.jwtService.decode(token) as JwtPayload & { jit: string };
    }
}
