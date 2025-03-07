import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { FacebookOAuth2Guard } from './guards/facebook-oauth2.guard';
import { CurrentUser, SkipAuth } from '../decorators';

@Controller({ path: 'auth/facebook', version: '1' })
@SkipAuth()
export class FacebookController {
    @UseGuards(FacebookOAuth2Guard)
    @Get()
    async facebookLogin() {
        return HttpStatus.OK;
    }

    @UseGuards(FacebookOAuth2Guard)
    @Get('callback')
    async facebookCallback(@CurrentUser() user) {
        return user;
    }
}
