import { Module } from '@nestjs/common';
import { redisProvider, redisProviderName } from './cache.provider';
import { CacheService } from './cache.service';

@Module({
    providers: [redisProvider, CacheService],
    exports: [redisProviderName, CacheService],
})
export class CacheModule {}
