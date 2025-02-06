import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards';
import { TokenService, AuthService } from './services';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccountRepository } from './repositories';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from '@database/entities';
import { UserModule } from '@modules/user/user.module';
import { JwtRefreshStrategy } from '@modules/auth/jwt-refresh.strategy';
import { CacheModule } from 'src/cache/cache.module';
import { RoleModule } from '@modules/role/role.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([AccountEntity]),
        ConfigModule,
        PassportModule.register({
            defaultStrategy: 'jwt',
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
        RoleModule,
        CacheModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        JwtStrategy,
        JwtRefreshStrategy,
        TokenService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        AccountRepository,
    ],
    exports: [JwtStrategy, JwtRefreshStrategy, PassportModule, TokenService, AuthService],
})
export class AuthModule {}
