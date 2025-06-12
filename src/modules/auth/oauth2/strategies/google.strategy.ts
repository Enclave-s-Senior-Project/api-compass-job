import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import * as passport from 'passport';

// Serialize user into session (store minimal data for efficiency)
passport.serializeUser((user, done) => {
    done(null, user); // You could store just `user.providerId` if you lookup later
});

// Deserialize user from session
passport.deserializeUser((user, done) => {
    done(null, user); // Retrieve the user as-is
});

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor() {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.SERVER_URL}/api/v1/auth/google/google-redirect`,
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
