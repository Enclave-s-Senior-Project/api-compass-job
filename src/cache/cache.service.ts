import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { redisProviderName } from './cache.provider';

@Injectable()
export class CacheService {
    private filterJobKey: string;
    private enterpriseFilterJobKey: string;
    private fcmTokenKey: string;

    constructor(@Inject(redisProviderName) private readonly redisClient: Redis) {
        this.filterJobKey = 'jobfilter:';
        this.enterpriseFilterJobKey = 'jobfilter:enterprise:';
        this.fcmTokenKey = 'fcmtoken:';
    }

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
    async storeCache(key: string, value: any, expireTime: number) {
        try {
            await this.redisClient.set(key, JSON.stringify(value), 'EX', expireTime);
        } catch (error) {
            throw error;
        }
    }
    async getCache(key: string) {
        try {
            const value = await this.redisClient.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            throw error;
        }
    }

    public async removeMultipleCacheWithPrefix(prefix: string) {
        try {
            let cursor = '0';
            const batchSize = 1000;
            const pipeline = this.redisClient.pipeline();

            do {
                const [nextCursor, keys] = await this.redisClient.scan(
                    cursor,
                    'MATCH',
                    `${prefix}*`,
                    'COUNT',
                    batchSize
                );
                cursor = nextCursor;

                if (keys.length > 0) {
                    keys.forEach((key) => pipeline.del(key));
                }

                // Execute deletion in batches
                if (pipeline.length >= batchSize) {
                    await pipeline.exec();
                }
            } while (cursor !== '0');

            // Execute any remaining deletions
            if (pipeline.length > 0) {
                await pipeline.exec();
            }

            return true;
        } catch (error) {
            throw error;
        }
    }

    public async removeSearchJobsCache() {
        return await this.removeMultipleCacheWithPrefix(this.filterJobKey);
    }

    public async removeEnterpriseSearchJobsCache() {
        return await this.removeMultipleCacheWithPrefix(this.enterpriseFilterJobKey);
    }

    public async cacheJobFilterData(key: string, results: any) {
        const cacheKey = this.filterJobKey + key;
        await this.redisClient.set(cacheKey, JSON.stringify(results), 'EX', 60 * 60 * 24); // Cache for 1 day
    }

    public async cacheEnterpriseJobFilterData(key: string, results: any) {
        const cacheKey = this.enterpriseFilterJobKey + key;
        await this.redisClient.set(cacheKey, JSON.stringify(results), 'EX', 60 * 60 * 24); // Cache for 1 day
    }

    public async getCacheJobFilter(key: string) {
        const cacheKey = this.filterJobKey + key;
        const cacheResult = await this.redisClient.get(cacheKey);
        return JSON.parse(cacheResult) || null;
    }

    public async getCacheEnterpriseJobFilter(key: string) {
        const cacheKey = this.enterpriseFilterJobKey + key;
        const cacheResult = await this.redisClient.get(cacheKey);
        return JSON.parse(cacheResult) || null;
    }

    public async cacheFCMToken(accountId: string, tokens: string[]) {
        const cacheKey = this.fcmTokenKey + accountId;
        await this.redisClient.set(cacheKey, JSON.stringify(tokens), 'EX', 60 * 60 * 24); // Cache for 1 day
    }

    public async getFCMTokens(accountId: string) {
        const cacheKey = this.fcmTokenKey + accountId;
        const cacheResult = await this.redisClient.get(cacheKey);
        return JSON.parse(cacheResult) || [];
    }

    public async removeFCMToken(accountId: string) {
        const cacheKey = this.fcmTokenKey + accountId;
        await this.redisClient.del(cacheKey);
    }

    public async removeAllFCMTokens() {
        await this.removeMultipleCacheWithPrefix(this.fcmTokenKey);
    }
}
