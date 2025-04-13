import { Body, Controller, Get, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { CurrentUser, SkipAuth } from '../../decorators';
import { OAuth2Service } from '../services/oauth2.service';
import { FacebookOAuth2Guard } from '../guards/facebook-oauth2.guard';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import { ConfirmOAuth2Dto } from '../dtos/confirm-oauth2.dto';

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
            const { authToken, iv } = await this.oauth2Service.oauth2Login(user);

            return res.redirect(
                `${this.configService.get<string>('CLIENT_URL_CALLBACK')}?authToken=${authToken}&iv=${iv}&provider=facebook`
            );
        } catch (error) {
            const errorCaught = ErrorCatchHelper.serviceCatch(error);
            return res.redirect(
                `${this.configService.get<string>('CLIENT_URL')}/sign-in?error_code=${errorCaught.message}`
            );
        }
    }

    @Post('/confirm')
    async confirmOAuth2(@Body() body: ConfirmOAuth2Dto, @Res({ passthrough: true }) res: Response) {
        try {
            const { builder, refreshToken, refreshTokenExpires } = await this.oauth2Service.confirmOAuth2Account(body);

            const isProd = process.env.NODE_ENV === 'production';

            res.cookie('refresh-token', refreshToken, {
                httpOnly: true,
                sameSite: isProd ? 'none' : 'lax',
                secure: isProd,
                maxAge: refreshTokenExpires,
            });

            return builder;
        } catch (error) {
            const errorCaught = ErrorCatchHelper.serviceCatch(error);
            return res.redirect(
                `${this.configService.get<string>('CLIENT_URL')}/sign-in?error_code=${errorCaught.message}`
            );
        }
    }
}
