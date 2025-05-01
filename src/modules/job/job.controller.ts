import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
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
import { CreateJobDto, CreateJobWishListDto, JobFilterDto, JobResponseDto, UpdateJobDto } from './dtos';
import { Request } from 'express';
import { JobWishlistDto } from './dtos/job-wishlist.dto';
import { JobStatusEnum } from '@src/common/enums/job.enum';
import { UpdateJobStatusDto } from './dtos/update-job-status';

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

    // @ApiBearerAuth(TOKEN_NAME)
    // @UseGuards(RolesGuard)
    // @Roles(Role.ADMIN)
    @SkipAuth()
    @HttpCode(200)
    @ApiOperation({ description: 'Get all jobs with pagination' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get()
    async findAll(@Query() queries: JobFilterDto): Promise<JobResponseDto> {
        return this.jobService.filter(queries);
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

    @SkipAuth()
    @HttpCode(200)
    @ApiOperation({ description: 'Search job' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get('search')
    filter(@Query() query: JobFilterDto) {
        return this.jobService.filter({ ...query, status: JobStatusEnum.OPEN, skip: query.skip });
    }
    @SkipAuth()
    @HttpCode(200)
    @ApiOperation({ description: 'Get job by ID' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get(':id')
    getDetailJobByJobId(@Query() user: JobWishlistDto, @Param('id') id: string): Promise<JobResponseDto> {
        return this.jobService.getDetailJobById(id, user.userId);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE, Role.ADMIN)
    @Put(':id')
    update(
        @Param('id') id: string,
        @Body() body: UpdateJobDto,
        @CurrentUser() user: JwtPayload
    ): Promise<JobResponseDto> {
        return this.jobService.updateJob(id, body, user);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE, Role.ADMIN)
    @Delete(':id')
    delete(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<JobResponseDto> {
        return this.jobService.deleteJob(id, user);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE, Role.ADMIN)
    @Patch(':id/close')
    @ApiOperation({ description: 'Close a job or mark it as expired. Only available for enterprise users and admins.' })
    closeJobOrMakeExpired(
        @Param('id') id: string,
        @CurrentUser() user: JwtPayload,
        @Body() body: { reason?: string }
    ): Promise<JobResponseDto> {
        return this.jobService.closeJob(id, user);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id/status')
    changeStatus(@Param('id') id: string, @Body() body: UpdateJobStatusDto): Promise<JobResponseDto> {
        return this.jobService.changeStatus(id, body);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE, Role.ADMIN)
    @Get(':id/estimate-rank')
    estimateRank(@Param('id') jobId: string, @Query('plusPoints') plusPoints?: number) {
        return this.jobService.estimateRankIfBoost(jobId, plusPoints);
    }
}
