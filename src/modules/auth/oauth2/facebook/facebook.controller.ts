import { Controller, Get, HttpStatus, Res, UseGuards } from '@nestjs/common';
import { CurrentUser, SkipAuth } from '../../decorators';
import { OAuth2Service } from '../services/oauth2.service';
import { FacebookOAuth2Guard } from '../guards/facebook-oauth2.guard';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ErrorCatchHelper } from 'src/helpers/error-catch.helper';

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
    async facebookCallback(@CurrentUser() user, @Res({ passthrough: true }) res: Response) {
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

            res.redirect(`${this.configService.get<string>('CLIENT_URL_CALLBACK')}?${query}`);
        } catch (error) {
            const errorCaught = ErrorCatchHelper.serviceCatch(error);
            res.redirect(`${this.configService.get<string>('CLIENT_URL')}/sign-in?error_code=${errorCaught.message}`);
        }
    }
}
