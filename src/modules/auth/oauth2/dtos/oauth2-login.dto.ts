import { OAuth2LoginErrorType } from '@common/errors/class-validator-error-type';
import { IsEmail, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class OAuth2Login {
    @IsString({ message: OAuth2LoginErrorType.PROVIDER_NOT_STRING })
    @IsNotEmpty({ message: OAuth2LoginErrorType.PROVIDER_REQUIRED })
    readonly provider: 'google' | 'facebook';

    @IsString({ message: OAuth2LoginErrorType.PROVIDER_ID_NOT_STRING })
    @IsNotEmpty({ message: OAuth2LoginErrorType.PROVIDER_ID_REQUIRED })
    readonly providerId: string;

    @IsString({ message: OAuth2LoginErrorType.NAME_NOT_STRING })
    @IsNotEmpty({ message: OAuth2LoginErrorType.NAME_REQUIRED })
    readonly name: string;

    @IsEmail(null, { message: OAuth2LoginErrorType.EMAIL_INVALID })
    @IsNotEmpty({ message: OAuth2LoginErrorType.EMAIL_REQUIRED })
    readonly email: string;

    @IsUrl(null, { message: OAuth2LoginErrorType.PHOTO_NOT_URL })
    @IsNotEmpty({ message: OAuth2LoginErrorType.PHOTO_REQUIRED })
    readonly photo: string;

    @IsString({ message: OAuth2LoginErrorType.ACCESS_TOKEN_NOT_STRING })
    @IsNotEmpty({ message: OAuth2LoginErrorType.ACCESS_TOKEN_REQUIRED })
    readonly accessToken: string;
}
