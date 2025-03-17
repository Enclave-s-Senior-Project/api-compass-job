import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JobService } from './service/job.service';
import {
    ApiBearerAuth,
    ApiInternalServerErrorResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtPayload, PaginationDto } from '@common/dtos';
import { RolesGuard } from '@modules/auth/guards/role.guard';
import { Role, Roles } from '@modules/auth/decorators/roles.decorator';
import { CurrentUser, SkipAuth, TOKEN_NAME } from '@modules/auth';
import { CreateJobDto, CreateJobWishListDto, JobFilterDto, JobResponseDto } from './dtos';
import { SKIP_AUTH } from '@modules/auth/constants';
import { JobEntity } from '@database/entities';
import { Request } from 'express';

@ApiTags('Job')
@Controller({ path: 'job', version: '1' })
export class JobController {
    constructor(private readonly jobService: JobService) {}
    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE, Role.ADMIN)
    @Post()
    create(@Body() createJobDto: CreateJobDto, @CurrentUser() user: JwtPayload): Promise<JobResponseDto> {
        return this.jobService.create(createJobDto, user.accountId, user.enterpriseId);
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

    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ description: 'Add job into wishlist' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Post('wishlist')
    createJobWishlist(@CurrentUser() user, @Body() body: CreateJobWishListDto): Promise<JobResponseDto> {
        return this.jobService.createJobWishList(body, user);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ description: 'Delete job from wishlist' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Delete('wishlist/:id')
    deleteJobWishlist(@CurrentUser() user, @Param('id') id: string): Promise<JobResponseDto> {
        return this.jobService.deleteJobWishList(id, user);
    }
    @ApiBearerAuth(TOKEN_NAME)
    @HttpCode(200)
    @ApiOperation({ description: 'Get jobs from wishlist' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get('wishlist')
    getJobWishList(@CurrentUser() user, @Query() query: PaginationDto): Promise<JobResponseDto> {
        return this.jobService.getJobWishList(query, user);
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
    @SkipAuth()
    @HttpCode(200)
    @ApiOperation({ description: 'Search job' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get('search')
    filter(@Query() query: JobFilterDto, @Req() req: Request) {
        return this.jobService.filter(query, req.url);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @HttpCode(200)
    @ApiOperation({ description: 'Get job by ID' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get(':id')
    getDetailJobByJobId(@CurrentUser() user, @Param('id') id: string): Promise<JobResponseDto> {
        return this.jobService.getDetailJobById(id, user);
    }
}
