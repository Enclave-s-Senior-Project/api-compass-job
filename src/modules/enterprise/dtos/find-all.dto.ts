import { PaginationDto } from '@src/common/dtos';
import { EnterpriseStatus } from '@src/common/enums';
import { OrganizationType } from '@src/database/entities/enterprise.entity';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindAllDto extends PaginationDto {
    @ApiProperty({
        description: 'Filter enterprises by their name',
        required: false,
    })
    @IsOptional()
    readonly name?: string;

    @ApiProperty({
        description: 'Filter enterprises by their status',
        enum: EnterpriseStatus,
        required: false,
    })
    @IsEnum(EnterpriseStatus)
    @IsOptional()
    readonly status?: EnterpriseStatus;

    @ApiProperty({
        description: 'Filter enterprises by organization type',
        enum: OrganizationType,
        required: false,
    })
    @IsEnum(OrganizationType, { each: true })
    @IsOptional()
    organizationType?: OrganizationType[];

    @ApiProperty({
        description: 'Filter enterprises by category ID',
        type: String,
        required: false,
        example: 'uuid',
    })
    @IsString()
    @IsOptional()
    readonly categoryId?: string;

    @ApiProperty({
        description: 'Filter enterprises by one or more addresses',
        required: false,
        example: ['New York', 'San Francisco'],
        isArray: true,
        type: String,
    })
    @IsString({ each: true })
    @IsOptional()
    readonly address?: string[];
}
