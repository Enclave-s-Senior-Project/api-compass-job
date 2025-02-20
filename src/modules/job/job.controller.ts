import { JobResponseDto } from './dtos/job-response.dto';
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JobService } from './service/job.service';
import { CreateJobDto } from './dtos/create-job.dto';
import { UpdateJobDto } from './dtos/update-job.dto';
import {
    ApiBearerAuth,
    ApiInternalServerErrorResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PaginationDto } from '@common/dtos';
import { JobRepository } from './repositories';
import { SkipAuth, TOKEN_NAME } from '@modules/auth';
import { JobFilterDto } from './dtos/job-filter.dto';

@ApiTags('Job')
@Controller({ path: 'job', version: '1' })
export class JobController {
    constructor(private readonly jobService: JobService) {}
    @ApiBearerAuth(TOKEN_NAME)
    @Post()
    create(@Body() createJobDto: CreateJobDto) {
        return this.jobService.create(createJobDto);
    }

    @SkipAuth()
    @HttpCode(200)
    @ApiOperation({ description: 'Get all jobs with pagination' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get()
    async findAll(@Query() PaginationDto: PaginationDto): Promise<JobResponseDto> {
        return this.jobService.getAllJobs(PaginationDto);
    }

    // @SkipAuth()
    // @HttpCode(200)
    // @ApiOperation({ description: 'Get job by name, location, category, advance' })
    // @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    // @ApiInternalServerErrorResponse({ description: 'Server error' })
    // @Get()
    // async findMany(
    //     @Query() jobFilterDto: JobFilterDto,
    //     @Query() PaginationDto: PaginationDto
    // ): Promise<JobResponseDto> {
    //     return this.jobService.getFilterJobs(jobFilterDto, PaginationDto);
    // }
}
