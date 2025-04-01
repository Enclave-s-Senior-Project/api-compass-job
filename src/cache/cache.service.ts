import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { redisProviderName } from './cache.provider';

@Injectable()
export class CacheService {
    constructor(@Inject(redisProviderName) private readonly redisClient: Redis) {}
    async deleteCache(extraExcludePatterns: string[] = []) {
        try {
            let cursor = '0';
            const batchSize = 1000;

            const excludePatterns = ['refreshtoken', ...extraExcludePatterns];

            do {
                const [nextCursor, keys] = await this.redisClient.scan(cursor, 'MATCH', '*', 'COUNT', batchSize);
                cursor = nextCursor;

                const keysToDelete = keys.filter((key) => !excludePatterns.some((pattern) => key.includes(pattern)));

                if (keysToDelete.length > 0) {
                    await this.redisClient.del(...keysToDelete);
                }
            } while (cursor !== '0');
        } catch (error) {
            throw error;
        }
    }
}
