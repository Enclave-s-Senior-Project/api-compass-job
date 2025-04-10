import { Injectable, NotFoundException } from '@nestjs/common';
import { FCMTokenRepository } from './repositories/fcm-token.repository';
import { CreateFcmTokenDto } from './dtos/create-fcm-token.dto';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import { UpdateFCMTokenDto } from './dtos/update-fcm-token.dto';
import { FCMTokenErrorType } from '@src/common/errors/fcm-token-error-type';
import { FCMResponseDtoBuilder } from './dtos/fcm-token-response.dto';
import { CacheService } from '@src/cache/cache.service';
import { In } from 'typeorm';

@Injectable()
export class FcmTokenService {
    constructor(
        private readonly fcmTokenRepository: FCMTokenRepository,
        private readonly cacheService: CacheService
    ) {}

    public async findOne(accountId: string, token: string) {
        try {
            return await this.fcmTokenRepository.findOne({
                where: { account: { accountId }, token: token },
                relations: { account: true },
                select: {
                    account: { accountId: true },
                    token: true,
                    tokenId: true,
                },
            });
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async getTokensByAccountId(accountId: string) {
        try {
            const tokens = await this.cacheService.getFCMTokens(accountId);
            if (tokens instanceof Array && tokens.length > 0) {
                return tokens;
            }
            const rawTokens = await this.fcmTokenRepository.find({
                where: { account: { accountId } },
                relations: { account: true },
                select: {
                    account: { accountId: true },
                    token: true,
                    tokenId: true,
                },
            });
            const handledTokens = rawTokens.map((token) => token.token);

            // store fcm tokens in cache
            this.cacheService.cacheFCMToken(accountId, handledTokens);

            return handledTokens;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async create(accountId: string, payload: CreateFcmTokenDto) {
        try {
            const builder = new FCMResponseDtoBuilder();
            const existingToken = await this.findOne(accountId, payload.token);

            if (existingToken) {
                return builder.setValue(existingToken).success().build();
            }

            const fcmToken = this.fcmTokenRepository.create({
                account: { accountId: accountId },
                token: payload.token,
            });
            await this.fcmTokenRepository.save(fcmToken);

            // remove old fcm token from cache
            this.cacheService.removeFCMToken(accountId);

            return builder.setValue(fcmToken).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async update(accountId: string, payload: UpdateFCMTokenDto) {
        try {
            const fcmToken = await this.findOne(accountId, payload.token);
            if (!fcmToken) {
                throw new NotFoundException(FCMTokenErrorType.NOT_FOUND);
            }
            const updatedToken = await this.fcmTokenRepository.save({ ...fcmToken, token: payload.token });

            // remove old fcm token from cache
            this.cacheService.removeFCMToken(accountId);

            return new FCMResponseDtoBuilder().setValue(updatedToken).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async delete(accountId: string, token: string) {
        try {
            const result = await this.fcmTokenRepository.delete({ account: { accountId }, token: token });

            // remove old fcm token from cache
            this.cacheService.removeFCMToken(accountId);

            return new FCMResponseDtoBuilder().setValue(result).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async deleteMany(accountId: string, tokens: string[]) {
        try {
            const result = await this.fcmTokenRepository.delete({ account: { accountId }, token: In(tokens) });

            // remove old fcm token from cache
            this.cacheService.removeFCMToken(accountId);

            return new FCMResponseDtoBuilder().setValue(result).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async deleteTokenWithoutAccountId(tokens: string[]) {
        try {
            const result = await this.fcmTokenRepository.delete({ token: In(tokens) });
            // remove old fcm token from cache
            this.cacheService.removeAllFCMTokens();

            return new FCMResponseDtoBuilder().setValue(result).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
