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
import { ProfileRepository } from '@modules/user/repositories';
@Module({
    imports: [forwardRef(() => AuthModule), TmpModule, ConfigModule, MailModule, CacheModule],
    providers: [OAuth2Service, TokenService, AccountRepository, ProfileRepository, UserService, JwtService],
    controllers: [FacebookController],
})
export class FacebookModule {}
