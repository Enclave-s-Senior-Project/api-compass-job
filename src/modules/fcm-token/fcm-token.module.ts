import { Module } from '@nestjs/common';
import { FcmTokenService } from './fcm-token.service';
import { FcmTokenController } from './fcm-token.controller';
import { FCMTokenRepository } from './repositories/fcm-token.repository';
import { TmpModule } from '../tmp/tmp.module';
import { CacheModule } from '@src/cache/cache.module';

@Module({
    imports: [TmpModule, CacheModule],
    controllers: [FcmTokenController],
    providers: [FcmTokenService, FCMTokenRepository],
    exports: [FcmTokenService],
})
export class FcmTokenModule {}
