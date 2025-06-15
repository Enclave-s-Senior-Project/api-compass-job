import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserRatingDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    enterpriseId: string;


    @ApiProperty({ minimum: 1, maximum: 5 })
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    comment?: string;
}
