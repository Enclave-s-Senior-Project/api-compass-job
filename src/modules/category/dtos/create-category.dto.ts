import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
    @ApiProperty({
        description: 'Name of the category',
        example: 'Information Technology',
        maxLength: 255,
    })
    @IsString()
    @IsNotEmpty({ message: 'Category name must not be empty.' })
    @MaxLength(255, { message: 'Category name cannot exceed 255 characters.' })
    categoryName: string;

    @ApiProperty({
        description: 'ID of the parent category (optional)',
        example: 'f3a2a5c4-7bd6-4a32-bdf3-e3b417ac2b90',
        required: false,
    })
    @IsOptional()
    @IsString({ message: 'Parent ID must be a string.' })
    parentId?: string;
}
