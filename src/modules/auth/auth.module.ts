import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards';
import { TokenService, AuthService } from './services';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccountRepository } from './repositories';
import { UserModule } from '@modules/user/user.module';
import { CacheModule } from 'src/cache/cache.module';
import { MailModule } from 'src/mail/mail.module';
import { TmpModule } from '@modules/tmp/tmp.module';
import { GoogleStrategy } from './oauth2/strategies/google.strategy';
import { FacebookModule } from './oauth2/facebook/facebook.module';
import { FacebookStrategy } from './oauth2/strategies/facebook-oauth2.strategy';
import { JwtRefreshStrategy, JwtStrategy } from './strategies';
import { GoogleModule } from './oauth2/google/google.module';

@Module({
    imports: [
        TmpModule,
        ConfigModule,
        PassportModule.register({
            defaultStrategy: 'jwt',
            session: true,
        }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => ({
                secret: config.get('ACCESS_TOKEN_SECRET'),
                signOptions: {
                    expiresIn: config.get('ACCESS_TOKEN_EXPIRES_IN'),
                },
            }),
            inject: [ConfigService],
        }),
        UserModule,
        CacheModule,
        MailModule,
        FacebookModule,
        GoogleModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        JwtStrategy,
        JwtRefreshStrategy,
        FacebookStrategy,
        TokenService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        AccountRepository,
        GoogleStrategy,
    ],
    exports: [JwtStrategy, JwtRefreshStrategy, PassportModule, TokenService, AuthService],
})
export class AuthModule {}
