import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { UpdateCompanyAddressDtoErrorType } from '@common/errors/class-validator-error-type';

export class UpdateCompanyAddressDto {
    @ApiProperty({ description: 'Enterprise', maxLength: 100 })
    @IsString({ message: UpdateCompanyAddressDtoErrorType.INVALID_ENTERPRISE })
    @IsNotEmpty({ message: UpdateCompanyAddressDtoErrorType.INVALID_ENTERPRISE })
    @MaxLength(100, { message: 'Enterprise must not exceed 100 characters' })
    readonly enterpriseId?: string;

    @ApiProperty({ description: 'Country', example: 'United States', maxLength: 100 })
    @IsString({ message: UpdateCompanyAddressDtoErrorType.INVALID_COUNTRY })
    @IsNotEmpty({ message: UpdateCompanyAddressDtoErrorType.COUNTRY_REQUIRED })
    @MaxLength(100, { message: 'Country must not exceed 100 characters' })
    readonly country: string;

    @ApiProperty({ description: 'City', example: 'New York', maxLength: 100 })
    @IsString({ message: UpdateCompanyAddressDtoErrorType.INVALID_CITY })
    @IsNotEmpty({ message: UpdateCompanyAddressDtoErrorType.CITY_REQUIRED })
    @MaxLength(100, { message: 'City must not exceed 100 characters' })
    readonly city: string;

    @ApiProperty({ description: 'Street', example: '5th Avenue', maxLength: 255 })
    @IsString({ message: UpdateCompanyAddressDtoErrorType.INVALID_STREET })
    @IsNotEmpty({ message: UpdateCompanyAddressDtoErrorType.STREET_REQUIRED })
    @MaxLength(255, { message: 'Street must not exceed 255 characters' })
    readonly street: string;

    @ApiProperty({ description: 'Zip code', example: '10001', maxLength: 20 })
    @IsString({ message: UpdateCompanyAddressDtoErrorType.INVALID_ZIP_CODE })
    @IsNotEmpty({ message: UpdateCompanyAddressDtoErrorType.ZIP_CODE_REQUIRED })
    @MaxLength(20, { message: 'Zip code must not exceed 20 characters' })
    readonly zipCode: string;
}
