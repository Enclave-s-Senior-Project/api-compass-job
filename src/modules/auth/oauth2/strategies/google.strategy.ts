import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor() {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_URL_CALLBACK,
            scope: ['email', 'profile'],
            passReqToCallback: true,
        });
    }
    async validate(req: Request, accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) {
        const { id, name, emails, photos, displayName } = profile;
        const payload = {
            provider: 'google',
            providerId: id,
            email: emails[0].value,
            name: displayName,
            photo: photos[0].value,
            accessToken,
            refreshToken,
        };
        done(null, { payload });
    }
}
