import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { InvalidCredentialsException } from '@common/http/exceptions';
import { JwtPayload } from './dtos';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(private configService: ConfigService) {
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

    async validate(request: Request, payload: JwtPayload): Promise<{ refreshToken: string } & JwtPayload> {
        if (!payload) {
            throw new InvalidCredentialsException();
        }
        // Return the JwtPayload with the required fields
        return { accountId: payload.accountId, roles: payload.roles, refreshToken: request.cookies?.['refresh-token'] };
    }
}
