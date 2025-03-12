import { AuthService } from '@modules/auth/services';
import { Injectable, NotAcceptableException } from '@nestjs/common';
import { OAuth2Login } from '../dtos';
import { AuthErrorType, OAuth2ErrorType } from '@common/errors/auth-error-type';
import { AccountEntity, UserStatus } from '@database/entities/account.entity';
import { HashHelper } from '@helpers';
import { JwtPayload } from '@common/dtos';
import { omit } from 'lodash';
import { FacebookResponseDtoBuilder } from '../dtos/facebook-response.dto';
import { ErrorCatchHelper } from 'src/helpers/error-catch.helper';

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
            }

            const userPayload = omit(account, ['password', 'active']);

            const jwtPayload: JwtPayload = {
                accountId: userPayload.accountId,
                profileId: userPayload?.profile?.profileId,
                enterpriseId: userPayload?.enterprise?.enterpriseId,
                roles: userPayload.roles,
            };

            const token = await this.tokenService.generateAuthToken(jwtPayload);
            await this.storeRefreshTokenOnCache(
                userPayload.accountId,
                token.refreshToken,
                token.refreshTokenExpires / 1000
            );

            const { refreshToken, refreshTokenExpires, ...tokenWithoutRefreshToken } = token;

            return {
                builder: new FacebookResponseDtoBuilder()
                    .setValue({
                        ...tokenWithoutRefreshToken,
                    })
                    .success()
                    .build(),
                refreshToken,
                refreshTokenExpires,
            };
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    private async createOAuth2Account(payload: OAuth2Login) {
        if (await this.accountRepository.exists({ where: { email: payload.email } })) {
            throw new NotAcceptableException(AuthErrorType.EMAIL_ALREADY_EXISTS);
        }
        const randomHashedPassword = await HashHelper.encrypt(crypto.randomUUID());

        const oauth2Id =
            payload.provider === 'facebook'
                ? { facebookId: payload.providerId }
                : payload.provider === 'google'
                  ? { googleId: payload.providerId }
                  : {};

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
    }
}
