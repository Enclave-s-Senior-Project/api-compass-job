import { Controller, Get, UseGuards, HttpStatus, Res } from '@nestjs/common';
import { OAuth2Service } from '../services/oauth2.service';
import { ConfigService } from '@nestjs/config';
import { GoogleOAuthGuard } from '../guards/google-oauth.guard';
import { CurrentUser, SkipAuth } from '@modules/auth/decorators';
import { Response } from 'express';
import { ErrorCatchHelper } from 'src/helpers/error-catch.helper';

@Controller({ path: 'auth/google', version: '1' })
@SkipAuth()
export class GoogleController {
    constructor(
        private readonly oauth2Service: OAuth2Service,
        private readonly configService: ConfigService
    ) {}

    @UseGuards(GoogleOAuthGuard)
    @Get('/')
    async googleAuth() {
        return HttpStatus.OK;
    }

    @UseGuards(GoogleOAuthGuard)
    @Get('/google-redirect')
    async googleAuthRedirect(@CurrentUser() user, @Res({ passthrough: true }) res: Response) {
        try {
            const { builder, refreshToken, refreshTokenExpires } = await this.oauth2Service.oauth2Login(user);
            res.cookie('refresh-token', refreshToken, {
                httpOnly: true,
                sameSite: true,
                secure: true,
                maxAge: refreshTokenExpires,
            });

            const query = new URLSearchParams({
                tokenType: builder.value.tokenType,
                accessToken: builder.value.accessToken,
                accessTokenExpires: builder.value.accessTokenExpires,
            }).toString();

            return res.redirect(`${this.configService.get<string>('CLIENT_URL_CALLBACK')}?${query}`);
        } catch (error) {
            const errorCaught = ErrorCatchHelper.serviceCatch(error);
            return res.redirect(
                `${this.configService.get<string>('CLIENT_URL')}/sign-in?error_code=${errorCaught.message}`
            );
        }
    }
}
