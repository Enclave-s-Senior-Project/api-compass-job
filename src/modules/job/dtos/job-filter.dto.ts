import { PaginationDto } from '@common/dtos';
import { JobFilterErrorType } from '@common/errors/class-validator-error-type';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EducationJobLevel } from '@src/common/enums/education-job.enum';
import { JobTypeEnum } from '@src/common/enums/job.enum';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, IsBoolean, IsArray, ArrayNotEmpty, isInt, Matches } from 'class-validator';

export class JobFilterDto extends PaginationDto {
    @ApiPropertyOptional({ description: 'Filter by job name' })
    @IsString({ message: JobFilterErrorType.NAME_NOT_STRING })
    @IsOptional()
    readonly name?: string;

    @ApiPropertyOptional({ description: 'Filter by country' })
    @IsString({ message: JobFilterErrorType.COUNTRY_NOT_STRING })
    @IsOptional()
    readonly country?: string;

    @ApiPropertyOptional({ description: 'Filter by city/province' })
    @IsString({ message: JobFilterErrorType.CITY_NOT_STRING })
    @IsOptional()
    readonly city?: string;

    @ApiPropertyOptional({ description: 'Filter by industry category' })
    @IsString({ message: JobFilterErrorType.INDUSTRY_CATEGORY_ID_NOT_STRING })
    @IsOptional()
    readonly industryCategoryId?: string;

    @ApiPropertyOptional({ description: 'Filter by majority category' })
    @IsString({ message: JobFilterErrorType.MAJORITY_CATEGORY_ID_NOT_STRING })
    @IsOptional()
    readonly majorityCategoryId?: string;

    @ApiPropertyOptional({ description: 'Filter by minimum wage' })
    @IsInt({ message: JobFilterErrorType.MIN_WAGE_NOT_INT })
    @Transform(({ value }) => Number(value))
    @IsOptional()
    readonly minWage?: number;

    @ApiPropertyOptional({ description: 'Filter by maximum wage' })
    @IsInt({ message: JobFilterErrorType.MAX_WAGE_NOT_INT }) // Fixed incorrect error type
    @Transform(({ value }) => Number(value))
    @IsOptional()
    readonly maxWage?: number;

    @ApiPropertyOptional({ description: 'Filter by experience required (in years)' })
    @Matches(/^\d+\s*-\s*\d+$/, { message: JobFilterErrorType.EXPERIENCE_OUT_OF_RANGE })
    @IsOptional()
    readonly experience?: string;

    @ApiPropertyOptional({ description: 'Filter by job type' })
    @IsArray({ message: JobFilterErrorType.TYPE_NOT_ARRAY_OF_STRINGS })
    @ArrayNotEmpty({ message: JobFilterErrorType.TYPE_NOT_ARRAY_OF_STRINGS })
    @IsString({ each: true, message: JobFilterErrorType.TYPE_NOT_ARRAY_OF_STRINGS })
    @IsOptional()
    readonly type?: JobTypeEnum[];

    @ApiPropertyOptional({ description: 'Filter by education level' })
    @IsArray({ message: JobFilterErrorType.EDUCATION_NOT_ARRAY_OF_STRINGS })
    @ArrayNotEmpty({ message: JobFilterErrorType.EDUCATION_NOT_ARRAY_OF_STRINGS })
    @IsString({ each: true, message: JobFilterErrorType.EDUCATION_NOT_ARRAY_OF_STRINGS })
    @IsOptional()
    readonly education?: EducationJobLevel[];

    @ApiPropertyOptional({ description: 'Filter by enterprise ID' })
    @IsString({ message: JobFilterErrorType.ENTERPRISE_ID_NOT_STRING })
    @IsOptional()
    readonly enterpriseId?: string;

    @ApiPropertyOptional({ description: 'Filter by tag ID' })
    @IsString({ message: JobFilterErrorType.TAG_ID_NOT_STRING })
    @IsOptional()
    readonly tagId?: string;

    @ApiPropertyOptional({ description: 'Filter by status (active or not)' })
    @IsBoolean({ message: JobFilterErrorType.STATUS_NOT_BOOLEAN })
    @IsOptional()
    readonly status?: boolean;

    @ApiPropertyOptional({ description: 'Filter by premium enterprises only' })
    @IsBoolean({ message: JobFilterErrorType.IS_PREMIUM_NOT_BOOLEAN })
    @IsOptional()
    readonly isPremium?: boolean;

    @ApiPropertyOptional({ description: 'Filter by minimum deadline date' })
    @IsString({ message: JobFilterErrorType.MIN_DEADLINE_NOT_STRING })
    @IsOptional()
    readonly minDeadline?: string;

    @ApiPropertyOptional({ description: 'Filter by maximum deadline date' })
    @IsString({ message: JobFilterErrorType.MAX_DEADLINE_NOT_STRING })
    @IsOptional()
    readonly maxDeadline?: string;
}
