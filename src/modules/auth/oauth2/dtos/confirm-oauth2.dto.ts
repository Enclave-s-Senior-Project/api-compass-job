import { ConfirmOAuth2DtoErrorType } from '@src/common/errors/class-validator-error-type';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmOAuth2Dto {
    @IsString({ message: ConfirmOAuth2DtoErrorType.AUTH_TOKEN_NOT_STRING })
    @IsNotEmpty({ message: ConfirmOAuth2DtoErrorType.AUTH_TOKEN_REQUIRED })
    authToken: string;

    @IsString({ message: ConfirmOAuth2DtoErrorType.IV_NOT_STRING })
    @IsNotEmpty({ message: ConfirmOAuth2DtoErrorType.IV_REQUIRED })
    iv: string;
}
