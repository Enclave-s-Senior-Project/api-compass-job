import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetTagsByNameDto {
    @ApiProperty({ type: String, description: 'List of tag names to search' })
    @IsString()
    name: string;
}
