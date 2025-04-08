import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { InvalidCredentialsException } from '@common/http/exceptions';
import { JwtPayload } from '@common/dtos';
import { AuthService } from '../services';
import { ErrorType } from '@src/common/enums';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(
        private configService: ConfigService,
        private readonly authService: AuthService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => {
                    let token = null;
                    if (request && request.cookies) {
                        token = request?.cookies?.['refresh-token'];
                        return token;
                    }
                    throw new InvalidCredentialsException();
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get('REFRESH_TOKEN_SECRET'),
            passReqToCallback: true,
        });
    }

    async validate(request: any, payload: JwtPayload): Promise<any> {
        console.log('{request}', request.cookies?.['refresh-token']);
        if (!payload) {
            throw new InvalidCredentialsException();
        }

        if (
            !(await this.authService.validateAndDelRefreshToken(payload.accountId, request.cookies?.['refresh-token']))
        ) {
            throw new BadRequestException(ErrorType.InvalidToken);
        }

        // Return the JwtPayload with the required fields
        return {
            payload: { ...payload, refreshToken: request.cookies?.['refresh-token'] },
        };
    }
}
