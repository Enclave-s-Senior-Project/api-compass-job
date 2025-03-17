import { PaginationDto } from '@common/dtos';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
export class JobFilterDto extends PaginationDto {
    @ApiPropertyOptional({ description: 'Filter by name job' })
    @IsString()
    @IsOptional()
    readonly name?: string;

    @ApiPropertyOptional({ description: 'Filter by country' })
    @IsString()
    @IsOptional()
    readonly country?: string;

    @ApiPropertyOptional({ description: 'Filter by city/province' })
    @IsString()
    @IsOptional()
    readonly city?: string;

    @ApiPropertyOptional({ description: 'Filter by industry category' })
    @IsString()
    @IsOptional()
    readonly industryCategoryId?: string;

    @ApiPropertyOptional({ description: 'Filter by majority category' })
    @IsString()
    @IsOptional()
    readonly majorityCategoryId?: string;
}
