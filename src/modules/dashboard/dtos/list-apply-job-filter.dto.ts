import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyJobFilter {
    @ApiPropertyOptional({ description: 'Filter by company' })
    @IsString()
    @IsOptional()
    readonly company?: string;
}
