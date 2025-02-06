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
                        console.log("Extracted refresh token: ", token); // Debugging the extracted token
                        return token;
                    }
                    throw new InvalidCredentialsException();
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: process.env.REFRESH_TOKEN_SECRET,
            passReqToCallback: true,
        });
    }

    async validate(payload: any): Promise<JwtPayload> {

        if (!payload) {
            throw new InvalidCredentialsException();
        }
        // Return the JwtPayload with the required fields
        return {
            id: payload?.id,
            username: payload?.username,
        };
    }
}
