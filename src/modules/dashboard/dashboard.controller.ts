import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiInternalServerErrorResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipAuth, TOKEN_NAME } from '../auth';
import { RolesGuard } from '../auth/guards/role.guard';
import { Role, Roles } from '../auth/decorators/roles.decorator';
import { ApplyJobFilter } from './dtos/list-apply-job-filter.dto';

@ApiTags('Dashboard')
@Controller({
    path: 'dashboard',
    version: '1',
})
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({ summary: 'Count user' })
    @ApiResponse({ status: 200, description: 'Status successfully.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    @ApiResponse({ status: 199, description: 'Same status.' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get('total-user')
    countUser() {
        return this.dashboardService.total();
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({ summary: 'List candidates apply job' })
    @ApiResponse({ status: 200, description: 'Status successfully.' })
    @ApiResponse({ status: 404, description: 'Not found.' })
    @ApiResponse({ status: 199, description: 'Same status.' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get('apply-job')
    getListCandidateApply(@Query() query: ApplyJobFilter) {
        return this.dashboardService.getListCandidateApply(query.company);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({ summary: 'List top apply job' })
    @ApiResponse({ status: 200, description: 'Status successfully.' })
    @ApiResponse({ status: 404, description: 'Not found.' })
    @ApiResponse({ status: 199, description: 'Same status.' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get('top-apply')
    getListTopAppliedJob() {
        return this.dashboardService.getListTopAppliedJob();
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({ summary: 'List data revenue' })
    @ApiResponse({ status: 200, description: 'Status successfully.' })
    @ApiResponse({ status: 404, description: 'Not found.' })
    @ApiResponse({ status: 199, description: 'Same status.' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get('revenue')
    getDataRevenue() {
        return this.dashboardService.getDataRevenue();
    }

    @SkipAuth()
    @ApiOperation({ summary: 'Count user' })
    @ApiResponse({ status: 200, description: 'Status successfully.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    @ApiResponse({ status: 199, description: 'Same status.' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get('total-home-page')
    Count() {
        return this.dashboardService.totalHomePage();
    }

    @SkipAuth()
    @ApiOperation({ summary: 'Category child' })
    @ApiResponse({ status: 200, description: 'Status successfully.' })
    @ApiResponse({ status: 404, description: 'Categories child not found.' })
    @ApiResponse({ status: 199, description: 'Same status.' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get('categories-child-home-page')
    CountCategoriesChild() {
        return this.dashboardService.getListCategoryChildrenHomePage();
    }

    @SkipAuth()
    @ApiOperation({ summary: 'Count categories' })
    @ApiResponse({ status: 200, description: 'Status successfully.' })
    @ApiResponse({ status: 404, description: 'Categories not found.' })
    @ApiResponse({ status: 199, description: 'Same status.' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get('categories-home-page')
    CountCategories() {
        return this.dashboardService.getListCategoryParentHomePage();
    }

    @SkipAuth()
    @ApiOperation({ summary: 'List enterprise' })
    @ApiResponse({ status: 200, description: 'Status successfully.' })
    @ApiResponse({ status: 404, description: 'Enterprise not found.' })
    @ApiResponse({ status: 199, description: 'Same status.' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get('job-home-page')
    getEnterpriseHomePage() {
        return this.dashboardService.getJobHomePage();
    }
}
