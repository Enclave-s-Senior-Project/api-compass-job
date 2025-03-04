import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe, UseGuards } from '@nestjs/common';
import { EnterpriseService } from './service/enterprise.service';
import { CreateEnterpriseDto, EnterpriseResponseDto, UpdateEnterpriseDto } from './dtos';

import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, TOKEN_NAME } from '@modules/auth';
import { RolesGuard } from '@modules/auth/guards/role.guard';
import { Role, Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtPayload } from '@common/dtos';

@ApiTags('Enterprise')
@Controller({
    path: 'enterprise',
    version: '1',
})
export class EnterpriseController {
    constructor(private readonly enterpriseService: EnterpriseService) {}
    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards()
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE, Role.ADMIN)
    @Post()
    @ApiOperation({ summary: 'Create a new enterprise' })
    @ApiResponse({ status: 201, description: 'Enterprise created successfully.' })
    create(
        @Body() createEnterpriseDto: CreateEnterpriseDto,
        @CurrentUser() user: JwtPayload
    ): Promise<EnterpriseResponseDto> {
        return this.enterpriseService.create(createEnterpriseDto, user);
    }

    @Get()
    @ApiOperation({ summary: 'Retrieve all enterprises' })
    @ApiResponse({ status: 200, description: 'List of enterprises.' })
    findAll() {
        return this.enterpriseService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Retrieve an enterprise by ID' })
    @ApiResponse({ status: 200, description: 'Enterprise details.' })
    @ApiResponse({ status: 404, description: 'Enterprise not found.' })
    findOne(@Param('id') id: string) {
        return this.enterpriseService.findOne(id);
    }

    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE, Role.ADMIN)
    @ApiOperation({ summary: 'Get enterprise by account Id.' })
    @ApiResponse({ status: 200, description: 'Get Enterprise by successfully.' })
    @ApiResponse({ status: 404, description: 'Enterprise not found.' })
    getEnterpriseByAccountId(@CurrentUser() user: JwtPayload) {
        return this.enterpriseService.getEnterpriseByAccountId(user.accountId);
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE, Role.ADMIN)
    @ApiOperation({ summary: 'Update an enterprise by ID' })
    @ApiResponse({ status: 200, description: 'Enterprise updated successfully.' })
    @ApiResponse({ status: 404, description: 'Enterprise not found.' })
    update(@Param('id') id: string, @Body() updateEnterpriseDto: UpdateEnterpriseDto) {
        return this.enterpriseService.update(id, updateEnterpriseDto);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete an enterprise by ID' })
    @ApiResponse({ status: 200, description: 'Enterprise deleted successfully.' })
    @ApiResponse({ status: 404, description: 'Enterprise not found.' })
    remove(@Param('id') id: string) {
        return this.enterpriseService.remove(id);
    }

    @Get(':id/jobs')
    @ApiOperation({ summary: 'Get all jobs related to an enterprise' })
    @ApiResponse({ status: 200, description: 'List of jobs associated with the enterprise.' })
    findJobsByEnterprise(@Param('id') id: string) {
        return this.enterpriseService.findJobsByEnterpriseId(id);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards()
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
        console.log('s', user.accountId);
        return this.enterpriseService.checkStatus(user.accountId);
    }
}
