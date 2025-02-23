import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, UseGuards } from '@nestjs/common';
import { ApplyJobService } from './services/apply-job.service';
import { CreateApplyJobDto } from './dto/create-apply-job.dto';
import { UpdateApplyJobDto } from './dto/update-apply-job.dto';
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
    async doApplyJob(
        @Body() createApplyJobDto: CreateApplyJobDto,
        @CurrentUser() user: JwtPayload
    ): Promise<ApplyJobResponseDto> {
        return this.applyJobService.doApplyJob(createApplyJobDto, user);
    }

    @Get()
    findAll() {
        return this.applyJobService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.applyJobService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateApplyJobDto: UpdateApplyJobDto) {
        return this.applyJobService.update(+id, updateApplyJobDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.applyJobService.remove(+id);
    }
}
import { ApplyJobResponseDto } from './dto';
