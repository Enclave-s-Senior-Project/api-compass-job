import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { UpdateCompanyAddressDtoErrorType } from '@common/errors/class-validator-error-type';

export class UpdateCompanyAddressDto {
    @ApiProperty({ description: 'Enterprise', maxLength: 100 })
    @IsString({ message: UpdateCompanyAddressDtoErrorType.INVALID_ENTERPRISE })
    @MaxLength(100, { message: UpdateCompanyAddressDtoErrorType.ENTERPRISE_MAX_LENGTH })
    @IsOptional()
    readonly enterpriseId?: string;

    @ApiProperty({ description: 'Country', example: 'United States', maxLength: 100 })
    @IsString({ message: UpdateCompanyAddressDtoErrorType.INVALID_COUNTRY })
    @IsNotEmpty({ message: UpdateCompanyAddressDtoErrorType.COUNTRY_REQUIRED })
    @MaxLength(100, { message: UpdateCompanyAddressDtoErrorType.COUNTRY_MAX_LENGTH })
    readonly country: string;

    @ApiProperty({ description: 'City', example: 'New York', maxLength: 100 })
    @IsString({ message: UpdateCompanyAddressDtoErrorType.INVALID_CITY })
    @IsNotEmpty({ message: UpdateCompanyAddressDtoErrorType.CITY_REQUIRED })
    @MaxLength(100, { message: UpdateCompanyAddressDtoErrorType.CITY_MAX_LENGTH })
    readonly city: string;

    @ApiProperty({ description: 'Street', example: '5th Avenue', maxLength: 255 })
    @IsString({ message: UpdateCompanyAddressDtoErrorType.INVALID_STREET })
    @IsNotEmpty({ message: UpdateCompanyAddressDtoErrorType.STREET_REQUIRED })
    @MaxLength(255, { message: UpdateCompanyAddressDtoErrorType.STREET_MAX_LENGTH })
    readonly street: string;

    @ApiProperty({ description: 'Zip code', example: '10001', maxLength: 20 })
    @IsString({ message: UpdateCompanyAddressDtoErrorType.INVALID_ZIP_CODE })
    @IsNotEmpty({ message: UpdateCompanyAddressDtoErrorType.ZIP_CODE_REQUIRED })
    @MaxLength(20, { message: UpdateCompanyAddressDtoErrorType.ZIP_CODE_MAX_LENGTH })
    readonly zipCode: string;
}
