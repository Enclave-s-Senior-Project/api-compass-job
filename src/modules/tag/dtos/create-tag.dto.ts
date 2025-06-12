import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTagDto {
    @ApiProperty({
        description: 'The name of the tag',
        example: 'Urgent',
        maxLength: 255,
    })
    @IsString()
    @Length(1, 255, { message: 'Name must be between 1 and 255 characters.' })
    readonly name: string;

    @ApiPropertyOptional({
        description: 'The text color of the tag in hex format',
        example: '#FF5733',
        maxLength: 7,
    })
    @IsOptional()
    @IsString()
    @Length(7, 7, { message: 'Color must be a valid hex code (e.g., #FFFFFF).' })
    @Matches(/^#([0-9A-Fa-f]{6})$/, { message: 'Color must be a valid hex color code.' })
    readonly color?: string;

    @ApiPropertyOptional({
        description: 'The background color of the tag in hex format',
        example: '#C70039',
        maxLength: 7,
    })
    @IsOptional()
    @IsString()
    @Length(7, 7, { message: 'Background color must be a valid hex code (e.g., #FFFFFF).' })
    @Matches(/^#([0-9A-Fa-f]{6})$/, { message: 'Background color must be a valid hex color code.' })
    readonly backgroundColor?: string;
}
