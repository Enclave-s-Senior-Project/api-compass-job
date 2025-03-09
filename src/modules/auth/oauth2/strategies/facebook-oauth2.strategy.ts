import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
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
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor(private readonly configService: ConfigService) {
        super({
            clientID: configService.get<string>('OAUTH_FACEBOOK_ID'),
            clientSecret: configService.get<string>('OAUTH_FACEBOOK_SECRET'),
            callbackURL: configService.get<string>('OAUTH_FACEBOOK_CALLBACK_URL'),
            profileFields: ['id', 'displayName', 'photos', 'email'],
            passReqToCallback: true,
        });
    }

    async validate(req: any, accessToken: string, refreshToken: string, profile: Profile, done: Function) {
        if (!profile) {
            done(Error('Profile is undefined'), null);
        }
        const { id, emails, displayName, photos } = profile;
        const payload = {
            provider: 'facebook',
            providerId: id,
            name: displayName,
            email: emails?.[0]?.value,
            photo: photos?.[0]?.value,
            accessToken,
        };
        done(null, { payload });
    }
}
