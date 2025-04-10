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
import { JobTypeEnum } from '@src/common/enums/job.enum';

export class CreateJobDto {
    @ApiProperty({ description: 'Job name', example: 'Software Engineer' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    readonly name: string;

    @ApiProperty({ description: 'Lowest wage', example: 3000.0, required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    readonly lowestWage?: number;

    @ApiProperty({ description: 'Highest wage', example: 5000.0, required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    readonly highestWage?: number;

    @ApiProperty({ description: 'Job description', example: 'Develop and maintain web applications.' })
    @IsString()
    @IsNotEmpty()
    readonly description: string;

    @ApiProperty({ description: 'Job responsibilities', example: 'Develop and maintain web applications.' })
    @IsString()
    @IsNotEmpty()
    readonly responsibility: string;

    @ApiProperty({ description: 'Job type', example: 'Full time', required: true })
    @IsOptional()
    @IsString()
    @Length(0, 50)
    readonly type: JobTypeEnum;

    @ApiProperty({ description: 'Years of experience required', example: 2 })
    @IsNumber()
    @Type(() => Number)
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

    @ApiProperty({ description: 'Job education requirement', example: 'Bachelor’s degree in Computer Science' })
    @IsString()
    @IsNotEmpty()
    readonly education: string;

    @ApiProperty({ description: 'Job benefits', example: 'Health insurance, Remote work options.', required: false })
    @IsOptional()
    @IsString()
    readonly enterpriseBenefits?: string | null;

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
    readonly address?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    readonly specializationIds?: string[];

    @ApiProperty({ description: 'Job requirements', example: 'Develop and maintain web applications.' })
    @IsString()
    @IsNotEmpty()
    readonly requirements: string;
}
