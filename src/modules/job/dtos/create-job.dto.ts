import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Length,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateAddressDto } from '@modules/address/dtos';

export class CreateJobDto {
    @ApiProperty({ description: 'Job name', example: 'Software Engineer' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    readonly name: string;

    @ApiProperty({ description: 'Lowest wage', example: '3000.00', required: false })
    @IsOptional()
    @IsString()
    readonly lowestWage?: string;

    @ApiProperty({ description: 'Highest wage', example: '5000.00', required: false })
    @IsOptional()
    @IsString()
    readonly highestWage?: string;

    @ApiProperty({ description: 'Job description', example: 'Develop and maintain web applications.' })
    @IsString()
    @IsNotEmpty()
    readonly description: string;

    @ApiProperty({ description: 'Job description', example: 'Develop and maintain web applications.' })
    @IsString()
    @IsNotEmpty()
    readonly responsibility: string;

    @ApiProperty({ description: 'Job type', example: 'Full-time', required: false })
    @IsOptional()
    @IsString()
    @Length(0, 50)
    readonly type?: string;

    @ApiProperty({ description: 'Years of experience required', example: 2 })
    @IsNumber()
    @Min(0)
    readonly experience: number;

    @ApiProperty({ description: 'Application deadline', example: '2025-03-31', required: false })
    @IsOptional()
    @IsDateString()
    readonly deadline?: Date;

    @ApiProperty({ description: 'Intro image URL', example: 'https://example.com/image.jpg', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    readonly introImg?: string;

    @ApiProperty({ description: 'Job status (active/inactive)', example: true })
    @IsBoolean()
    readonly status: boolean;

    @ApiProperty({ description: 'Enterprise ID', example: 'f9a74c91-6ebf-4d92-8b57-d4d9cacf8abc' })
    @IsString()
    @IsNotEmpty()
    readonly enterpriseId: string;

    @ApiProperty({ description: 'List of tag IDs', example: ['a1b2c3d4-5678-90ab-cdef-1234567890ab'], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    readonly tagIds?: string[];

    @ApiProperty({
        description: 'List of category IDs',
        example: ['c1d2e3f4-5678-90ab-cdef-0987654321ba'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    readonly categoryIds?: string[];

    @ApiProperty({
        description: 'List of address IDs',
        example: ['b1c2d3e4-5678-90ab-cdef-abcdefabcdef'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    readonly address: string[];
}
