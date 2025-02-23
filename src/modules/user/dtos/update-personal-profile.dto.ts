import { UpdatePersonalProfileDtoErrorType } from '@common/errors/class-validator-error-type';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class UpdatePersonalProfileDto {
    @IsString({ message: UpdatePersonalProfileDtoErrorType.PROFILE_URL_REQUIRED })
    @IsNotEmpty({ message: UpdatePersonalProfileDtoErrorType.PROFILE_URL_STRING })
    readonly profileUrl: string;

    @IsString({ message: UpdatePersonalProfileDtoErrorType.PROFILE_URL_REQUIRED })
    @IsNotEmpty({ message: UpdatePersonalProfileDtoErrorType.PROFILE_URL_STRING })
    readonly pageUrl: string;

    readonly education: string;
    readonly experience: string;

    @IsOptional()
    @Matches(/^\+(?:[0-9]\x20?){6,14}[0-9]$/, { message: UpdatePersonalProfileDtoErrorType.PHONE_NUMBER_INVALID })
    readonly phone: string;
}
