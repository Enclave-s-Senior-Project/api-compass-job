import { PaginationDto } from '@common/dtos';
import { GenderType } from '@database/entities';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaritalStatusType } from '@src//database/entities/profile.entity';
import { IsEnum, IsOptional, IsString } from 'class-validator';

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
}
