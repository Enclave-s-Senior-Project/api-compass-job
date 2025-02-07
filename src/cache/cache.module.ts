import { Module } from '@nestjs/common';
import Redis from 'ioredis';

@Module({
    providers: [
        {
            provide: 'CACHE_INSTANCE',
            useFactory: () => {
                const redis = new Redis({
                    host: process.env.REDIS_HOST,
                    port: Number(process.env.REDIS_PORT),
                    password: process.env.REDIS_PASSWORD,
                    retryStrategy: (times) => Math.min(times * 50, 2000),
                });

                redis.on('connect', () => console.log('Redis connected successfully!'));
                redis.on('ready', () => console.log('Redis is ready to use!'));
                redis.on('error', (err) => console.error('Redis connection error:', err));
                redis.on('end', () => console.warn('Redis connection closed!'));

                return redis;
            },
        },
    ],
    exports: ['CACHE_INSTANCE'],
})
export class CacheModule {}
