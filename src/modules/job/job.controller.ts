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
import { CurrentUser, SkipAuth, TOKEN_NAME } from '@modules/auth';
import { JobFilterDto } from './dtos/job-filter.dto';
import { RolesGuard } from '@modules/auth/guards/role.guard';
import { Role, Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtPayload } from '@modules/auth/dtos';

@ApiTags('Job')
@Controller({ path: 'job', version: '1' })
export class JobController {
    constructor(private readonly jobService: JobService) {}
    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE, Role.ADMIN)
    @Post()
    create(@Body() createJobDto: CreateJobDto, @CurrentUser() user: JwtPayload): Promise<JobResponseDto> {
        return this.jobService.create(createJobDto, user.accountId);
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
