import { forwardRef, Module } from '@nestjs/common';
import { GoogleController } from './google.controller';
import { AuthModule } from '@modules/auth/auth.module';
import { TmpModule } from '@modules/tmp/tmp.module';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from '@mail/mail.module';
import { CacheModule } from '@cache/cache.module';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@modules/user/service';
import { ProfileRepository } from '@modules/user/repositories';
import { AccountRepository } from '@modules/auth/repositories';
import { TokenService } from '@modules/auth/services';
import { OAuth2Service } from '../services/oauth2.service';

@Module({
    imports: [forwardRef(() => AuthModule), TmpModule, ConfigModule, MailModule, CacheModule],
    providers: [OAuth2Service, TokenService, AccountRepository, ProfileRepository, UserService, JwtService],
    controllers: [GoogleController],
})
export class GoogleModule {}
