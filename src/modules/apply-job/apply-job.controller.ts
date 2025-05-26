import { Controller, Get, Post, Body, Patch, Param, HttpCode, UseGuards, Query } from '@nestjs/common';
import { ApplyJobService } from './services/apply-job.service';
import { CreateApplyJobDto } from './dtos/create-apply-job.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, TOKEN_NAME } from '@modules/auth';
import { RolesGuard } from '@modules/auth/guards/role.guard';
import { Role, Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtPayload, PaginationDto } from '@common/dtos';
import { ApplyJobResponseDto } from './dtos';
import { UpdateApplicationStatusDto } from './dtos/update-application-status.dto';
import { GetDetailsApplicationDto } from './dtos/get-details-application';

@ApiTags('Apply-job')
@Controller({ path: 'apply-job', version: '1' })
export class ApplyJobController {
    constructor(private readonly applyJobService: ApplyJobService) {}

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.USER)
    @Post()
    async applyJob(
        @Body() createApplyJobDto: CreateApplyJobDto,
        @CurrentUser() user: JwtPayload
    ): Promise<ApplyJobResponseDto> {
        return this.applyJobService.applyJob(createApplyJobDto, user);
    }

    @HttpCode(200)
    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ description: 'Get social links by ID profile' })
    @Get('/own')
    async getOwnAppliedJob(@CurrentUser() user, @Query() pagination: PaginationDto) {
        return this.applyJobService.getAppliedJobByProfileId(user?.profileId, pagination);
    }

    @HttpCode(200)
    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ description: 'Get totals applicants' })
    @Get('/total')
    async getTotalAppliedJob(@CurrentUser() user) {
        return this.applyJobService.getTotalAppliedJob(user?.enterpriseId);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({
        summary: 'Get details of a job application',
        description: 'Allows candidates and enterprises to retrieve details of a specific job application',
    })
    @Get(':id/details')
    getAppliedJobsDetails(@CurrentUser() user, @Query() queries: GetDetailsApplicationDto, @Param('id') id: string) {
        return this.applyJobService.getDetails(id, user, queries.role);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE, Role.ADMIN)
    @ApiOperation({ summary: 'Retrieve all candidates ' })
    @ApiResponse({ status: 200, description: 'List of candidates applied job.' })
    @Get('/:id')
    async listCandidatesApplyJob(
        @CurrentUser() user: JwtPayload,
        @Param('id') jobId: string,
        @Query() filter: PaginationDto
    ): Promise<ApplyJobResponseDto> {
        return this.applyJobService.listCandidatesApplyJob(user.enterpriseId, jobId, filter);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE, Role.ADMIN)
    @ApiOperation({
        summary: 'Update application status',
        description: 'Allows enterprise users and admins to update the status of a job application',
    })
    @Patch('status')
    updateApplicationStatus(@Body() body: UpdateApplicationStatusDto, @CurrentUser() user) {
        return this.applyJobService.updateApplicationStatus(body, user);
    }
}
