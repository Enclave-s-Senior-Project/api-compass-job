import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe } from '@nestjs/common';
import { EnterpriseService } from './service/enterprise.service';
import { CreateEnterpriseDto, EnterpriseResponseDto, UpdateEnterpriseDto } from './dtos';

import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtPayload } from '@modules/auth/dtos';
import { CurrentUser, TOKEN_NAME } from '@modules/auth';

@ApiTags('Enterprise')
@Controller({
    path: 'enterprise',
    version: '1',
})
export class EnterpriseController {
    constructor(private readonly enterpriseService: EnterpriseService) {}
    @ApiBearerAuth(TOKEN_NAME)
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

    @Patch(':id')
    @ApiOperation({ summary: 'Update an enterprise by ID' })
    @ApiResponse({ status: 200, description: 'Enterprise updated successfully.' })
    @ApiResponse({ status: 404, description: 'Enterprise not found.' })
    update(@Param('id') id: string, @Body() updateEnterpriseDto: UpdateEnterpriseDto) {
        return this.enterpriseService.update(id, updateEnterpriseDto);
    }

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

    @Get(':id/addresses')
    @ApiOperation({ summary: 'Get all addresses associated with an enterprise' })
    @ApiResponse({ status: 200, description: 'List of addresses related to the enterprise.' })
    findAddressesByEnterprise(@Param('id') id: string) {
        return this.enterpriseService.findAddressesByEnterpriseId(id);
    }
}
