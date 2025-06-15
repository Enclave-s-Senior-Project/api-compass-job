import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRatingDto {
    @ApiProperty({
        description: 'The rating of the user',
        example: 5,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(5)
    rating?: number;

    @ApiProperty({
        description: 'The comment of the user',
        example: 'This is a comment',
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    comment?: string;
}
