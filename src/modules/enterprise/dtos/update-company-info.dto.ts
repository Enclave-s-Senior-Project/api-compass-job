import { UpdateCompanyInfoDtoErrorType } from '@common/errors/class-validator-error-type';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsPhoneNumber, IsString, IsUrl, Matches, MaxLength } from 'class-validator';

export class UpdateCompanyInfoDto {
    @ApiProperty({ description: 'Company logo URL', maxLength: 255 })
    @IsNotEmpty({ message: UpdateCompanyInfoDtoErrorType.LOGO_URL_REQUIRED })
    @MaxLength(255, { message: 'Logo URL must not exceed 255 characters' })
    readonly logoUrl: string;

    @ApiProperty({ description: 'Background image URL', maxLength: 255 })
    @MaxLength(255, { message: 'Background image URL must not exceed 255 characters' })
    @IsOptional()
    readonly backgroundImageUrl?: string;

    @ApiProperty({ description: 'Company name', maxLength: 255 })
    @IsString({ message: UpdateCompanyInfoDtoErrorType.INVALID_NAME })
    @IsNotEmpty({ message: UpdateCompanyInfoDtoErrorType.NAME_REQUIRED })
    @MaxLength(255, { message: 'Name must not exceed 255 characters' })
    readonly name: string;

    @ApiProperty({ description: 'Company bio' })
    @IsString({ message: UpdateCompanyInfoDtoErrorType.INVALID_BIO })
    @IsOptional()
    readonly bio?: string;

    @ApiProperty({ description: 'Contact phone number', maxLength: 18 })
    @IsPhoneNumber(null, { message: UpdateCompanyInfoDtoErrorType.PHONE_NUMBER_INVALID })
    @MaxLength(18, { message: 'Phone number must not exceed 18 characters' })
    @IsOptional()
    readonly phone?: string;
}
