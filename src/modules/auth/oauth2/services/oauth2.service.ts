import { AuthService } from '@modules/auth/services';
import { Injectable, NotAcceptableException } from '@nestjs/common';
import { OAuth2Login } from '../dtos';
import { AuthErrorType, OAuth2ErrorType } from '@common/errors/auth-error-type';
import { AccountEntity, UserStatus } from '@database/entities/account.entity';
import { HashHelper } from '@helpers';
import { JwtPayload } from '@common/dtos';
import { omit } from 'lodash';
import { FacebookResponseDtoBuilder } from '../dtos/facebook-response.dto';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import * as crypto from 'crypto';
import { ConfirmOAuth2Dto } from '../dtos/confirm-oauth2.dto';

@Injectable()
export class OAuth2Service extends AuthService {
    public async oauth2Login(payload: OAuth2Login) {
        if (!payload.email) {
            throw new NotAcceptableException(OAuth2ErrorType.FACEBOOK_EMAIL_REQUIRED);
        }

        try {
            let account = await this.findOne(payload.email, { name: payload.provider, id: payload.providerId });

            if (!account) {
                account = await this.createOAuth2Account(payload);
            } else if (account.status !== UserStatus.ACTIVE) {
                throw new NotAcceptableException(AuthErrorType.ACCOUNT_INACTIVE);
            }

            const expiredInMilliseconds = 1000 * 60; // 1 minute
            const expired = new Date(Date.now() + expiredInMilliseconds);

            const { encryptedData: authToken, iv } = HashHelper.encode([account.accountId, expired].join(','));

            return {
                authToken,
                iv,
            };
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    private async createOAuth2Account(payload: OAuth2Login) {
        try {
            const accountExists = await this.accountRepository.findOne({
                where: {
                    email: payload.email,
                },
            });

            const oauth2Id =
                payload.provider === 'facebook'
                    ? { facebookId: payload.providerId }
                    : payload.provider === 'google'
                      ? { googleId: payload.providerId }
                      : {};

            if (!accountExists) {
                const randomHashedPassword = await HashHelper.encrypt(crypto.randomUUID());

                const newAccount = (await this.accountRepository.save({
                    email: payload.email,
                    password: randomHashedPassword,
                    status: UserStatus.ACTIVE,
                    roles: ['USER'],
                    ...oauth2Id,
                })) as AccountEntity;

                await this.userService.createUser({
                    fullName: payload.name,
                    profileUrl: payload.photo,
                    account: newAccount.accountId,
                });

                return newAccount;
            } else {
                if (
                    (payload.provider === 'facebook' &&
                        accountExists.facebookId !== payload.providerId &&
                        accountExists.facebookId !== null) ||
                    (payload.provider === 'google' &&
                        accountExists.googleId !== payload.providerId &&
                        accountExists.googleId !== null)
                ) {
                    throw new NotAcceptableException(AuthErrorType.EMAIL_ALREADY_EXISTS);
                } else {
                    return await this.accountRepository.save({
                        ...accountExists,
                        ...oauth2Id,
                    });
                }
            }
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async confirmOAuth2Account(payload: ConfirmOAuth2Dto) {
        try {
            const { authToken, iv } = payload;

            const decryptedData = HashHelper.decode(authToken, iv);
            const [accountId, expired] = decryptedData.split(',');

            if (new Date() > new Date(expired)) {
                throw new NotAcceptableException(OAuth2ErrorType.AUTH_TOKEN_EXPIRED);
            }

            const account = await this.findOneById(accountId);

            if (!account) {
                throw new NotAcceptableException(AuthErrorType.USER_NOT_FOUND);
            } else if (account.status !== UserStatus.ACTIVE) {
                throw new NotAcceptableException(AuthErrorType.ACCOUNT_INACTIVE);
            }

            const jwtPayload: JwtPayload = {
                accountId: account.accountId,
                profileId: account?.profile?.profileId,
                enterpriseId: account?.enterprise?.enterpriseId,
                roles: account.roles,
            };

            const token = await this.tokenService.generateAuthToken(jwtPayload);
            await this.storeRefreshTokenOnCache(
                account.accountId,
                token.refreshToken,
                token.refreshTokenExpires / 1000
            );

            const { refreshToken, refreshTokenExpires, ...tokenWithoutRefreshToken } = token;

            return {
                builder: new FacebookResponseDtoBuilder()
                    .setValue({ ...tokenWithoutRefreshToken, refreshTokenExpires })
                    .success()
                    .build(),
                refreshToken,
                refreshTokenExpires,
            };
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
