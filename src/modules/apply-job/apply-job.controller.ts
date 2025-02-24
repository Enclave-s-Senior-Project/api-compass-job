import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, UseGuards } from '@nestjs/common';
import { ApplyJobService } from './services/apply-job.service';
import { CreateApplyJobDto } from './dtos/create-apply-job.dto';
import { UpdateApplyJobDto } from './dtos/update-apply-job.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, TOKEN_NAME } from '@modules/auth';
import { RolesGuard } from '@modules/auth/guards/role.guard';
import { Role, Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtPayload } from '@common/dtos';

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
}
import { ApplyJobResponseDto } from './dtos';
