import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { FacebookOAuth2Guard } from './guards/facebook-oauth2.guard';
import { SkipAuth } from '../decorators';

@Controller({ path: 'auth/facebook', version: '1' })
@SkipAuth()
export class FacebookController {
    @UseGuards(FacebookOAuth2Guard)
    @Get()
    async facebookLogin(@Req() req) {
        // redirects the user to Facebook for authorization
    }

    @UseGuards(FacebookOAuth2Guard)
    @Get('callback')
    async facebookCallback(@Req() req: any, @Res() res: Response) {
        return req?.user;
    }
}
