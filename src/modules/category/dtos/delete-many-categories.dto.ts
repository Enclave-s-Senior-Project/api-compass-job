import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class DeleteManyCategoriesDto {
    @ApiProperty({
        description: 'Array of category IDs to delete',
        type: [String],
        example: ['id1', 'id2', 'id3'],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    categoryIds: string[];
}
