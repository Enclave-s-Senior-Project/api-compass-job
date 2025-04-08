import { Controller, Get, HttpStatus, Res, UseGuards } from '@nestjs/common';
import { CurrentUser, SkipAuth } from '../../decorators';
import { OAuth2Service } from '../services/oauth2.service';
import { FacebookOAuth2Guard } from '../guards/facebook-oauth2.guard';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
@Controller({ path: 'auth/facebook', version: '1' })
@SkipAuth()
export class FacebookController {
    constructor(
        private readonly oauth2Service: OAuth2Service,
        private readonly configService: ConfigService
    ) {}

    @UseGuards(FacebookOAuth2Guard)
    @Get()
    async facebookLogin() {
        return HttpStatus.OK;
    }

    @UseGuards(FacebookOAuth2Guard)
    @Get('callback')
    async facebookCallback(@CurrentUser() user, @Res() res: Response) {
        try {
            const { builder, refreshToken, refreshTokenExpires } = await this.oauth2Service.oauth2Login(user);
            res.cookie('refresh-token', refreshToken, {
                httpOnly: true,
                sameSite: 'none', // Required for cross-site cookies
                secure: true,
                maxAge: refreshTokenExpires,
                priority: 'high',
            });

            const query = new URLSearchParams({
                tokenType: builder.value.tokenType,
                accessToken: builder.value.accessToken,
                accessTokenExpires: builder.value.accessTokenExpires,
            }).toString();

            return res
                .writeHead(302, {
                    Location: `${this.configService.get<string>('CLIENT_URL_CALLBACK')}?${query}`,
                    cookie: `refresh-token=${refreshToken}; HttpOnly; SameSite=None; Secure; Max-Age=${refreshTokenExpires}; Priority=high`,
                })
                .end();
        } catch (error) {
            const errorCaught = ErrorCatchHelper.serviceCatch(error);
            return res.redirect(
                `${this.configService.get<string>('CLIENT_URL')}/sign-in?error_code=${errorCaught.message}`
            );
        }
    }
}
