import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
export class ListJobIdsDto {
    @ApiPropertyOptional({ description: 'Ids of Job' })
    @IsArray()
    @IsOptional()
    readonly related_jobs?: string[];
}
