import { UpdateFoundingInfoDtoErrorType } from '@common/errors/class-validator-error-type';
import { OrganizationType } from '@database/entities/enterprise.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateFoundingInfoDto {
    @ApiPropertyOptional({
        description: 'Description of the company',
        example: 'We are a tech company focused on AI solutions.',
    })
    @IsString({ message: UpdateFoundingInfoDtoErrorType.INVALID_DESCRIPTION })
    @IsOptional()
    readonly description?: string = null;

    @ApiPropertyOptional({
        description: 'Benefits the enterprise provides',
        example: 'Health insurance, Flexible working hours, Remote work options.',
    })
    @IsString({ message: UpdateFoundingInfoDtoErrorType.INVALID_ENTERPRISE_BENEFITS })
    @IsOptional()
    readonly enterpriseBenefits?: string = null;

    @ApiPropertyOptional({
        description: 'The bio of the company',
        example: 'We are a tech company focused on AI solutions.',
    })
    @IsString({ message: UpdateFoundingInfoDtoErrorType.INVALID_BIO })
    @IsOptional()
    readonly bio?: string = null;

    @ApiPropertyOptional({
        description: 'The vision of the company',
        example: 'To become the leading AI service provider in Southeast Asia.',
    })
    @IsString({ message: UpdateFoundingInfoDtoErrorType.INVALID_COMPANY_VISION })
    @IsOptional()
    readonly companyVision?: string = null;

    @ApiProperty({
        description: 'The date when the company was founded',
        example: '2020-01-15',
    })
    @IsNotEmpty({ message: UpdateFoundingInfoDtoErrorType.FOUNDED_IN_REQUIRED })
    readonly foundedIn: Date;

    @ApiPropertyOptional({
        description: 'The organization type',
        enum: OrganizationType,
        example: OrganizationType.PRIVATE,
    })
    @IsEnum(OrganizationType, { message: UpdateFoundingInfoDtoErrorType.INVALID_ORGANIZATION_TYPE })
    @IsOptional()
    readonly organizationType?: OrganizationType = null;

    @ApiPropertyOptional({
        description: 'Size of the team',
        example: '10-50 employees',
    })
    @IsString({ message: UpdateFoundingInfoDtoErrorType.INVALID_TEAM_SIZE })
    @IsOptional()
    readonly teamSize?: string = null;

    @ApiProperty({
        description: 'The industry type of the company',
        example: 'Information Technology',
    })
    @IsArray({ message: UpdateFoundingInfoDtoErrorType.INVALID_INDUSTRY_TYPE })
    @IsNotEmpty({ message: UpdateFoundingInfoDtoErrorType.INDUSTRY_TYPE_REQUIRED })
    readonly categories?: string[];

    @ApiProperty({ example: 'johndoe@example.com', required: false })
    @IsOptional()
    @IsNotEmpty()
    @IsEmail()
    email?: string;
}
