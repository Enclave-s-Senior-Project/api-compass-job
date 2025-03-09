import { Controller, Get, HttpStatus, Res, UseGuards } from '@nestjs/common';
import { CurrentUser, SkipAuth } from '../../decorators';
import { OAuth2Service } from '../services/oauth2.service';
import { FacebookOAuth2Guard } from '../guards/facebook-oauth2.guard';
import { Response } from 'express';

@Controller({ path: 'auth/facebook', version: '1' })
@SkipAuth()
export class FacebookController {
    constructor(private readonly oauth2Service: OAuth2Service) {}

    @UseGuards(FacebookOAuth2Guard)
    @Get()
    async facebookLogin() {
        return HttpStatus.OK;
    }

    @UseGuards(FacebookOAuth2Guard)
    @Get('callback')
    async facebookCallback(@CurrentUser() user, @Res() res: Response) {
        const { builder, refreshToken, refreshTokenExpires } = await this.oauth2Service.oauth2Login(user);
        res.cookie('refresh-token', refreshToken, {
            httpOnly: true,
            sameSite: true,
            secure: true,
            maxAge: refreshTokenExpires,
        });

        return builder;
    }
}
