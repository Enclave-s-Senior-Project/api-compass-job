import { EnterpriseStatus } from '@common/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsDateString,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
    Matches,
} from 'class-validator';

enum OrganizationType {
    PRIVATE = 'PRIVATE',
    FLAT = 'FLAT',
    PUBLIC = 'PUBLIC',
    OUTSOURCE = 'OUTSOURCE',
}

export class CreateEnterpriseDto {
    @ApiProperty({ description: 'Enterprise name', maxLength: 255 })
    @IsString()
    @Length(1, 255, { message: 'Name must be between 1 and 255 characters.' })
    @IsNotEmpty({ message: 'Name is required.' })
    readonly name: string;

    @ApiProperty({ description: 'Enterprise email', maxLength: 255 })
    @IsEmail({}, { message: 'Email must be valid.' })
    @Length(1, 255)
    readonly email: string;

    @ApiProperty({ description: 'Enterprise phone number', maxLength: 15 })
    @IsString()
    @Matches(/^\+?\d{7,15}$/, { message: 'Phone must be a valid phone number.' })
    readonly phone: string;

    @ApiPropertyOptional({ description: 'Enterprise description' })
    @IsOptional()
    @IsString()
    readonly description?: string;

    @ApiPropertyOptional({ description: 'Enterprise benefits' })
    @IsOptional()
    @IsString()
    readonly enterpriseBenefits?: string;

    @ApiPropertyOptional({ description: 'Company vision' })
    @IsOptional()
    @IsString()
    readonly companyVision?: string;

    @ApiPropertyOptional({ description: 'Logo URL', maxLength: 255 })
    @IsOptional()
    @IsString()
    @Length(0, 255)
    readonly logoUrl?: string;

    @ApiPropertyOptional({ description: 'Background URL', maxLength: 255 })
    @IsOptional()
    @IsString()
    @Length(0, 255)
    readonly backgroundImageUrl?: string;

    @ApiPropertyOptional({ description: 'Founded date', type: String, format: 'date' })
    @IsOptional()
    @IsDateString()
    readonly foundedIn?: Date;

    @ApiPropertyOptional({ description: 'Organization type', enum: OrganizationType })
    @IsOptional()
    @IsEnum(OrganizationType, { message: 'Organization type must be one of: PRIVATE, FLAT, PUBLIC, OUTSOURCE.' })
    readonly organizationType?: OrganizationType;

    @ApiPropertyOptional({ description: 'Team size', maxLength: 50 })
    @IsOptional()
    @IsString()
    @Length(0, 50)
    readonly teamSize?: string;

    @ApiPropertyOptional({ description: 'Status', enum: EnterpriseStatus })
    @IsOptional()
    @IsEnum(EnterpriseStatus, { message: 'Status must be one of: PENDING, ACTIVE, REJECTED, BLOACKED.' })
    readonly status?: EnterpriseStatus;

    @ApiPropertyOptional({ description: 'Industry type', maxLength: 255 })
    @IsOptional()
    @IsString()
    @Length(0, 255)
    readonly industryType?: string;

    @ApiPropertyOptional({ description: 'Short bio' })
    @IsOptional()
    @IsString()
    readonly bio?: string;
}
