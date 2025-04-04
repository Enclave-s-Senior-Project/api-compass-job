import { PaginationDto } from '@common/dtos';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatusEnum, JobTypeEnum } from '@src/common/enums/job.enum';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export enum SortByEnum {
    ASC = 'ASC',
    DESC = 'DESC',
    DEADLINE = 'DEADLINE',
    NEWEST = 'NEWEST',
    LATEST = 'LATEST',
}

export class FindJobsByEnterpriseDto extends PaginationDto {
    @ApiPropertyOptional({
        description: 'Filter by job type',
        enum: JobTypeEnum,
    })
    @IsOptional()
    @IsEnum(JobTypeEnum)
    jobType?: JobTypeEnum;

    @ApiPropertyOptional({
        description: 'Filter by job status',
        enum: JobStatusEnum,
    })
    @IsOptional()
    @IsEnum(JobStatusEnum)
    jobStatus?: JobStatusEnum;

    @ApiPropertyOptional({
        description: 'Filter by job location',
    })
    @IsOptional()
    @IsString()
    jobLocation?: string;

    @ApiPropertyOptional({
        description: 'Filter by job experience level',

        default: 1,
    })
    @Matches(/\d{1,2}-\d{1,3}/)
    @IsOptional()
    jobExperience?: string;

    @ApiPropertyOptional({
        description: 'Filter by job boost status',
        type: Boolean,
    })
    @IsOptional()
    jobBoost?: Boolean;

    @ApiPropertyOptional({
        description: 'Search term for multiple fields',
        type: String,
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    search?: string;

    @ApiPropertyOptional({
        description: 'Sort by field',
        enum: SortByEnum,
        default: SortByEnum.NEWEST,
    })
    @IsOptional()
    @IsEnum(SortByEnum)
    sort?: SortByEnum;
}
