import { Module } from '@nestjs/common';
import { redisProvider, redisProviderName } from './cache.provider';

@Module({
    providers: [redisProvider],
    exports: [redisProviderName],
})
export class CacheModule {}
