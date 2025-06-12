// dtos/create-child-categories.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ChildCategoryDto {
    @ApiProperty({
        description: 'Name of the child category',
        example: 'Frontend Development',
        maxLength: 255,
    })
    @IsString()
    @IsNotEmpty({ message: 'Category name must not be empty.' })
    @MaxLength(255, { message: 'Category name cannot exceed 255 characters.' })
    categoryName: string;
}

export class CreateChildCategoriesDto {
    @ApiProperty({
        description: 'List of child categories',
        type: [ChildCategoryDto],
    })
    @IsArray({ message: 'Child categories must be an array.' })
    @ValidateNested({ each: true })
    @Type(() => ChildCategoryDto)
    children: ChildCategoryDto[];
}
