import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode } from '@nestjs/common';
import { BoostJobService } from './boost-job.service';
import { CreateBoostJobDto } from './dto/create-boost-job.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, TOKEN_NAME } from '@modules/auth';
import { RolesGuard } from '@modules/auth/guards/role.guard';
import { Role, Roles } from '@modules/auth/decorators/roles.decorator';
import { BoostJobJobResponseDto } from './dto/boost-job-response.dto';

@Controller({ path: 'boost-job', version: '1' })
@ApiBearerAuth(TOKEN_NAME)
export class BoostJobController {
    constructor(private readonly boostJobService: BoostJobService) {}

    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE)
    @HttpCode(200)
    @Post()
    async create(
        @CurrentUser() user: any,
        @Body() createBoostJobDto: CreateBoostJobDto
    ): Promise<BoostJobJobResponseDto> {
        return this.boostJobService.create(createBoostJobDto, user.enterpriseId);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE)
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<BoostJobJobResponseDto> {
        return this.boostJobService.checkBoostJob(id);
    }
}
