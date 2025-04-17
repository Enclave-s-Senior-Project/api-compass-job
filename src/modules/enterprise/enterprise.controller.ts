import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req, HttpCode } from '@nestjs/common';
import { EnterpriseService } from './service/enterprise.service';
import {
    CreateEnterpriseDto,
    EnterpriseResponseDto,
    RegisterPremiumEnterpriseDto,
    UpdateCompanyAddressDto,
    UpdateEnterpriseDto,
} from './dtos';

import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiUnauthorizedResponse,
    ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { CurrentUser, SkipAuth, TOKEN_NAME } from '@modules/auth';
import { RolesGuard } from '@modules/auth/guards/role.guard';
import { Role, Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtPayload, PaginationDto } from '@common/dtos';
import { UpdateCompanyInfoDto } from './dtos/update-company-info.dto';
import { UpdateFoundingInfoDto } from './dtos/update-founding-dto';
import { CreateCandidateWishListDto } from './dtos/create-candidate-wishlist.dto';
import { FilterCandidatesProfileDto } from './dtos/filter-candidate.dto';
import { FindJobsByEnterpriseDto } from './dtos/find-job-by-enterprise.dto';

@ApiTags('Enterprise')
@Controller({
    path: 'enterprise',
    version: '1',
})
export class EnterpriseController {
    constructor(private readonly enterpriseService: EnterpriseService) {}

    @HttpCode(200)
    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE)
    @ApiOperation({ description: 'Get all candidate with pagination' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get('candidate')
    async getAllCandidate(@CurrentUser() user, @Query() pageOptionsDto: FilterCandidatesProfileDto) {
        pageOptionsDto.industryId = Array.isArray(pageOptionsDto.industryId)
            ? pageOptionsDto.industryId
            : pageOptionsDto.industryId
              ? [pageOptionsDto.industryId]
              : undefined;
        return this.enterpriseService.getAllCandidate(pageOptionsDto, user);
    }
    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.USER)
    @Post()
    @ApiOperation({ summary: 'Create a new enterprise' })
    @ApiResponse({ status: 201, description: 'Enterprise created successfully.' })
    create(
        @Body() createEnterpriseDto: CreateEnterpriseDto,
        @CurrentUser() user: JwtPayload
    ): Promise<EnterpriseResponseDto> {
        return this.enterpriseService.create(createEnterpriseDto, user);
    }

    @SkipAuth()
    @Get()
    @ApiOperation({ summary: 'Retrieve all enterprises' })
    @ApiResponse({ status: 200, description: 'List of enterprises.' })
    findAll(@Query() paginationDto: PaginationDto): Promise<EnterpriseResponseDto> {
        return this.enterpriseService.findAll(paginationDto);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE)
    @Get('me')
    @ApiOperation({ summary: 'Check if the current user has created an enterprise' })
    @ApiResponse({ status: 200, description: 'User has an enterprise.' })
    getCurrentEnterprise(@CurrentUser() user: JwtPayload) {
        return this.enterpriseService.getMe(user.enterpriseId);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE)
    @Patch('address')
    @ApiOperation({ summary: 'Check if the current user has created an enterprise' })
    @ApiResponse({ status: 200, description: 'User has an enterprise.' })
    updateCompanyAddress(@CurrentUser() user: JwtPayload, @Body() body: UpdateCompanyAddressDto) {
        return this.enterpriseService.updateCompanyAddress(user.enterpriseId, body);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE)
    @ApiOperation({ summary: "Update information about enterprise's company" })
    @ApiResponse({ status: 200, description: 'Updated information.' })
    @Patch('company')
    updateCompanyInfo(@CurrentUser() user: JwtPayload, @Body() body: UpdateCompanyInfoDto) {
        return this.enterpriseService.updatePartialInfoActive(body, user);
    }
    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE)
    @Patch('founding')
    @ApiOperation({ summary: "Update information about enterprise's founding" })
    @ApiResponse({ status: 200, description: 'Updated information.' })
    updateFoundingInfo(@CurrentUser() user: JwtPayload, @Body() body: UpdateFoundingInfoDto) {
        return this.enterpriseService.updatePartialInfoActive(body, user);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE)
    @Patch('premium')
    @ApiOperation({ summary: "Update information about enterprise's founding" })
    @ApiResponse({ status: 200, description: 'Updated information.' })
    updateEnterprisePremium(@CurrentUser() user: JwtPayload, @Body() body: RegisterPremiumEnterpriseDto) {
        return;
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE)
    @ApiOperation({ summary: 'Get all jobs related to an enterprise' })
    @Get('me/jobs')
    @ApiResponse({ status: 200, description: 'List of jobs associated with the enterprise.' })
    getOwnJobs(@CurrentUser() user: JwtPayload, @Query() paginationDto: FindJobsByEnterpriseDto) {
        return this.enterpriseService.findJobsByEnterpriseId(user.enterpriseId, paginationDto);
    }

    @SkipAuth()
    @Get(':id/jobs')
    @ApiOperation({ summary: 'Get all jobs related to an enterprise' })
    @ApiResponse({ status: 200, description: 'List of jobs associated with the enterprise.' })
    findJobsByEnterprise(@Param('id') id: string, @Query() paginationDto: FindJobsByEnterpriseDto) {
        return this.enterpriseService.findJobsByEnterpriseId(id, paginationDto);
    }

    @SkipAuth()
    @Get(':id/total-jobs')
    @ApiOperation({ summary: 'Get all jobs related to an enterprise' })
    @ApiResponse({ status: 200, description: 'List of jobs associated with the enterprise.' })
    totalJobsByEnterprise(@Param('id') id: string): Promise<EnterpriseResponseDto> {
        return this.enterpriseService.totalJobsByEnterprise(id);
    }

    @SkipAuth()
    @Get(':id')
    @ApiOperation({ summary: 'Retrieve an enterprise by ID' })
    @ApiResponse({ status: 200, description: 'Enterprise details.' })
    @ApiResponse({ status: 404, description: 'Enterprise not found.' })
    findOne(@Param('id') id: string) {
        return this.enterpriseService.findEnterpriseById(id);
    }

    // @Get(':id')
    // @UseGuards(RolesGuard)
    // @Roles(Role.ENTERPRISE, Role.ADMIN)
    // @ApiOperation({ summary: 'Get enterprise by account Id.' })
    // @ApiResponse({ status: 200, description: 'Get Enterprise by successfully.' })
    // @ApiResponse({ status: 404, description: 'Enterprise not found.' })
    // getEnterpriseByAccountId(@CurrentUser() user: JwtPayload) {
    //     return this.enterpriseService.getEnterpriseByAccountId(user.accountId);
    // }

    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.ENTERPRISE)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete an enterprise by ID' })
    @ApiResponse({ status: 200, description: 'Enterprise deleted successfully.' })
    @ApiResponse({ status: 404, description: 'Enterprise not found.' })
    remove(@Param('id') id: string) {
        return this.enterpriseService.remove(id);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE, Role.ADMIN)
    @Get('me/addresses')
    @ApiOperation({ summary: 'Get all addresses associated with an enterprise' })
    @ApiResponse({ status: 200, description: 'List of addresses related to the enterprise.' })
    findAddressesByEnterprise(@CurrentUser() user: JwtPayload) {
        return this.enterpriseService.findAddressesByEnterpriseId(user?.enterpriseId);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @Get('me/check')
    @ApiOperation({ summary: 'Check if the current user has created an enterprise' })
    @ApiResponse({ status: 200, description: 'User has an enterprise.' })
    checkUserEnterprise(@CurrentUser() user: JwtPayload) {
        return this.enterpriseService.checkStatus(user.accountId);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE, Role.ADMIN)
    @ApiOperation({ summary: 'Update an enterprise by ID' })
    @ApiResponse({ status: 200, description: 'Enterprise updated successfully.' })
    @ApiResponse({ status: 404, description: 'Enterprise not found.' })
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateEnterpriseDto: UpdateEnterpriseDto) {
        return this.enterpriseService.update(id, updateEnterpriseDto);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.USER, Role.ENTERPRISE)
    @ApiOperation({ summary: 'Get enterprise by account Id.' })
    @ApiResponse({ status: 200, description: 'Get Enterprise by successfully.' })
    @ApiResponse({ status: 404, description: 'Enterprise not found.' })
    @Delete('/cancel-enterprise/:id')
    cancelEnterprises(@Param('id') id: string) {
        return this.enterpriseService.cancelEnterprise(id);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.USER)
    @ApiOperation({ summary: 'Update an enterprise by ID' })
    @ApiResponse({ status: 200, description: 'Enterprise updated successfully.' })
    @ApiResponse({ status: 404, description: 'Enterprise not found.' })
    @Patch('/update-enterprise/:id')
    updateEnterprise(@Param('id') id: string, @Body() updateEnterpriseDto: UpdateEnterpriseDto) {
        return this.enterpriseService.updateRegisterEnterprise(id, updateEnterpriseDto);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @Roles(Role.USER, Role.ENTERPRISE)
    @ApiOperation({ description: 'Add candidate into wishlist' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Post('wishlist')
    createCandidatesWishlist(
        @CurrentUser() user,
        @Body() body: CreateCandidateWishListDto
    ): Promise<EnterpriseResponseDto> {
        return this.enterpriseService.createCandidateWishList(user, body);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @Roles(Role.USER, Role.ENTERPRISE)
    @ApiOperation({ description: 'Add delete candidate into wishlist' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Delete('wishlist/:id')
    deleteCandidatesWishlist(
        @CurrentUser() user,
        @Param('id') id: string,
        @Req() req: Request
    ): Promise<EnterpriseResponseDto> {
        return this.enterpriseService.deleteCandidateWishList(user, id);
    }
}
