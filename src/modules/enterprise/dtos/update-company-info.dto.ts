import { UpdateCompanyInfoDtoErrorType } from '@common/errors/class-validator-error-type';
import { IsNotEmpty, IsOptional, IsPhoneNumber, IsString, IsUrl } from 'class-validator';

export class UpdateCompanyInfoDto {
    @IsUrl(null, { message: UpdateCompanyInfoDtoErrorType.INVALID_LOGO_URL })
    @IsNotEmpty({ message: UpdateCompanyInfoDtoErrorType.LOGO_URL_REQUIRED })
    readonly logoUrl: string;

    @IsUrl(null, { message: UpdateCompanyInfoDtoErrorType.INVALID_BACKGROUND_IMAGE })
    @IsOptional()
    readonly backgroundImageUrl?: string = null;

    @IsString({ message: UpdateCompanyInfoDtoErrorType.INVALID_NAME })
    @IsNotEmpty({ message: UpdateCompanyInfoDtoErrorType.NAME_REQUIRED })
    readonly name: string;

    @IsString({ message: UpdateCompanyInfoDtoErrorType.INVALID_BIO })
    @IsOptional()
    readonly bio?: string = null;

    @IsPhoneNumber(null, { message: UpdateCompanyInfoDtoErrorType.PHONE_NUMBER_INVALID })
    @IsOptional()
    readonly phone?: string = null;
}
