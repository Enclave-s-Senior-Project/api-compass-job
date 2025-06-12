import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { JobService } from './service/job.service';
import {
    ApiBearerAuth,
    ApiInternalServerErrorResponse,
    ApiOperation,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtPayload, PaginationDto } from '@common/dtos';
import { RolesGuard } from '@modules/auth/guards/role.guard';
import { Role, Roles } from '@modules/auth/decorators/roles.decorator';
import { CurrentUser, SkipAuth, TOKEN_NAME } from '@modules/auth';
import { JobFilterDto, JobResponseDto } from './dtos';
import { JobStatusEnum, JobTypeEnum } from '@src/common/enums/job.enum';
import { EducationJobLevel } from '@src/common/enums/education-job.enum';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

class SearchJobsQueryDto {
    @IsOptional()
    @IsArray()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return value.split(',').map((item) => item.trim());
            }
        }
        return value;
    })
    tags?: string[];

    @IsOptional()
    @IsString()
    skills?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => Number(value))
    salary_min?: number;

    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => Number(value))
    salary_max?: number;

    @IsOptional()
    @IsEnum(JobTypeEnum, { each: true })
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return value.split(',').map((item) => item.trim());
            }
        }
        return value;
    })
    job_type?: JobTypeEnum[];

    @IsOptional()
    @IsEnum(EducationJobLevel, { each: true })
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return value.split(',').map((item) => item.trim());
            }
        }
        return value;
    })
    experience_level?: EducationJobLevel[];

    @IsOptional()
    @IsString()
    remote_option?: string;

    @IsOptional()
    @IsString()
    name_job?: string;

    @IsOptional()
    @IsEnum(JobStatusEnum)
    status?: JobStatusEnum;
}

@ApiTags('Job Tools')
@Controller({ path: 'job-tools', version: '1' })
export class JobToolsController {
    constructor(private readonly jobService: JobService) {}

    @SkipAuth()
    @HttpCode(200)
    @ApiOperation({ description: 'Search jobs by skills and filters' })
    @ApiQuery({
        name: 'tags',
        required: false,
        type: [String],
        isArray: true,
        description: 'Array of tags (can be comma-separated or JSON array)',
    })
    @ApiQuery({ name: 'skills', required: false, type: String })
    @ApiQuery({ name: 'location', required: false, type: String })
    @ApiQuery({ name: 'salary_min', required: false, type: Number })
    @ApiQuery({ name: 'salary_max', required: false, type: Number })
    @ApiQuery({
        name: 'job_type',
        required: false,
        enum: JobTypeEnum,
        isArray: true,
        description: 'Array of job types (can be comma-separated or JSON array)',
    })
    @ApiQuery({
        name: 'experience_level',
        required: false,
        enum: EducationJobLevel,
        isArray: true,
        description: 'Array of experience levels (can be comma-separated or JSON array)',
    })
    @ApiQuery({ name: 'remote_option', required: false, type: String })
    @ApiQuery({ name: 'name_job', required: false, type: String })
    @ApiQuery({ name: 'status', required: false, enum: JobStatusEnum })
    @Get('search')
    async searchJobs(@Query(new ValidationPipe({ transform: true })) query: SearchJobsQueryDto) {
        const searchQuery = {
            tags: query.tags || [],
            location: query.location || '',
            lowestWage: query.salary_min,
            highestWage: query.salary_max,
            type: query.job_type || [],
            education: query.experience_level || [],
            name: query.name_job || '',
            status: query.status || JobStatusEnum.OPEN,
        };
        return this.jobService.searchJobs(searchQuery);
    }
    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.USER)
    @HttpCode(200)
    @ApiOperation({ description: 'Apply for a job' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Post(':id/apply')
    async applyJob(
        @Param('id') jobId: string,
        @CurrentUser() user: JwtPayload,
        @Body() body: { cvId: string; coverLetter?: string }
    ): Promise<JobResponseDto> {
        return this.jobService.applyJob(jobId, user.accountId, body);
    }

    @SkipAuth()
    @HttpCode(200)
    @ApiOperation({ description: 'Get job details by ID' })
    @Get(':id')
    async getJobDetails(@Param('id') id: string) {
        return this.jobService.getDetailJob(id);
    }
}
