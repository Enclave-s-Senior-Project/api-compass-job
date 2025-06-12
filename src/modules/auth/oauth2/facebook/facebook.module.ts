import { forwardRef, Module } from '@nestjs/common';
import { FacebookController } from './facebook.controller';
import { AuthModule } from '@modules/auth/auth.module';
import { OAuth2Service } from '../services/oauth2.service';
import { TmpModule } from '@modules/tmp/tmp.module';
import { ConfigModule } from '@nestjs/config';
import { TokenService } from '@modules/auth/services';
import { AccountRepository } from '@modules/auth/repositories';
import { MailModule } from '@mail/mail.module';
import { CacheModule } from '@cache/cache.module';
import { UserService } from '@modules/user/service';
import { JwtService } from '@nestjs/jwt';
import { CategoryModule } from '@modules/category/category.module';
import { UserModule } from '@src/modules/user/user.module';
@Module({
    imports: [
        forwardRef(() => AuthModule),
        TmpModule,
        ConfigModule,
        MailModule,
        CacheModule,
        CategoryModule,
        UserModule,
    ],
    providers: [OAuth2Service, TokenService, JwtService, AccountRepository],
    controllers: [FacebookController],
})
export class FacebookModule {}
