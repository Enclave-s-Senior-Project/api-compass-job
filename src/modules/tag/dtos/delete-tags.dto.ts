import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class DeleteTagsDto {
    @ApiProperty({
        description: 'Array of tag IDs to delete',
        example: ['uuid1', 'uuid2', 'uuid3'],
        type: [String],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('4', { each: true })
    tagIds: string[];
}
