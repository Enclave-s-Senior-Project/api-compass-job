import { PaginationDto } from '@common/dtos';
import { Education, Experience } from '@common/enums/candidates.enum';
import { GenderType } from '@database/entities';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaritalStatusType } from '@src/database/entities/profile.entity';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FilterCandidatesProfileDto extends PaginationDto {
    @ApiProperty({ enum: GenderType, required: false })
    @IsOptional()
    @IsEnum(GenderType)
    gender?: GenderType;

    @ApiProperty({ enum: MaritalStatusType, required: false })
    @IsOptional()
    @IsEnum(MaritalStatusType)
    isMaried?: MaritalStatusType;

    @ApiProperty({ type: [String], isArray: true, required: false })
    @IsString({ each: true })
    @IsOptional()
    industryId?: string[] | string;

    @ApiPropertyOptional({ description: 'Check filter', required: false })
    @IsOptional()
    readonly check?: boolean;
}
