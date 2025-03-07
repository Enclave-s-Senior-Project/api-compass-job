import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor(private readonly configService: ConfigService) {
        super({
            clientID: configService.get<string>('OAUTH_FACEBOOK_ID'),
            clientSecret: configService.get<string>('OAUTH_FACEBOOK_SECRET'),
            callbackURL: configService.get<string>('OAUTH_FACEBOOK_CALLBACK_URL'),
            profileFields: ['id', 'displayName', 'photos', 'email'],
            scope: ['email', 'public_profile'], // Explicitly request these scopes
            enableProof: true,
            passReqToCallback: true,
        });
    }

    async validate(req: any, accessToken: string, refreshToken: string, profile: Profile) {
        console.log({ profile });
        if (!profile) {
            throw new Error('Profile is undefined');
        }
        const { id, emails, displayName, photos } = profile;
        return {
            provider: 'facebook', // Corrected from 'google' to 'facebook'
            providerId: id,
            name: displayName,
            email: emails?.[0]?.value, // Emails is an array of objects with 'value'
            photo: photos?.[0]?.value, // Photos is an array of objects with 'value'
        };
    }
}

// @Get('facebook/callback')
// @UseGuards(AuthGuard('facebook'))
// async facebookLoginCallback(@Req() req): Promise<any> {
//   // handles the Facebook OAuth2 callback
//   return req.user;
// }
