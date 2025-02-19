import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
export class JobFilterDto {
    @ApiPropertyOptional({ description: 'Filter by name job' })
    @IsString()
    @IsOptional()
    readonly name?: string;

    @ApiPropertyOptional({ description: 'Filter by location job' })
    @IsString()
    @IsOptional()
    readonly location?: string;

    @ApiPropertyOptional({ description: 'Filter by status job' })
    @IsString()
    @IsOptional()
    readonly status?: string; // 'pending', 'ongoing', 'completed', 'cancelled'
}
