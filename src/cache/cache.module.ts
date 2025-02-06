import { Module } from '@nestjs/common';
import { Cacheable } from 'cacheable';
import { createKeyv } from '@keyv/redis';

@Module({
    providers: [
        {
            provide: 'CACHE_INSTANCE',
            useFactory: () => {
                const secondary = createKeyv(
                    `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
                );
                return new Cacheable({ secondary });
            },
        },
    ],
    exports: ['CACHE_INSTANCE'],
})
export class CacheModule {}
