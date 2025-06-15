import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    HttpCode,
    HttpStatus,
    UseGuards,
    Query,
} from '@nestjs/common';
import { ReportService } from './services/report.service';
import { CreateReportDto } from './dtos/create-report.dto';
import { UpdateReportDto } from './dtos/update-report.dto';
import { ReportResponseDto } from './dtos/report-response.dto';
import { CurrentUser, JwtAuthGuard, TOKEN_NAME } from '@src/modules/auth';
import { JwtPayload, PaginationDto } from '@src/common/dtos';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '@src/modules/auth/guards/role.guard';
import { Role, Roles } from '@src/modules/auth/decorators/roles.decorator';
import { ReportEnterpriseStatus } from '@database/entities/report-enterprise.entity';
import { ReportFilterDto } from './dtos/params-report.dto';

@ApiTags('Reports')
@ApiBearerAuth(TOKEN_NAME)
@Controller({
    path: 'reports',
    version: '1',
})
export class ReportController {
    constructor(private readonly reportService: ReportService) {}
    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.USER)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new report' })
    @ApiResponse({ status: 201, type: ReportResponseDto })
    async create(@Body() createDto: CreateReportDto, @CurrentUser() user: JwtPayload): Promise<ReportResponseDto> {
        return await this.reportService.create(createDto, user.profileId);
    }

    // get all reports has pagination
    @Get()
    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get all reports' })
    @ApiResponse({ status: 200, type: ReportResponseDto })
    async getAll(@Query() query: ReportFilterDto): Promise<ReportResponseDto> {
        return await this.reportService.getAll(query);
    }

    @Patch(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update a report' })
    @ApiResponse({ status: 200, type: ReportResponseDto })
    async update(@Param('id') id: string, @Body() updateDto: UpdateReportDto): Promise<ReportResponseDto> {
        return await this.reportService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete a report' })
    @ApiResponse({ status: 200, type: ReportResponseDto })
    async delete(@Param('id') id: string): Promise<ReportResponseDto> {
        return await this.reportService.delete(id);
    }

    @Get(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get a report by ID' })
    @ApiResponse({ status: 200, type: ReportResponseDto })
    async getById(@Param('id') id: string): Promise<ReportResponseDto> {
        return await this.reportService.getById(id);
    }

    @Get('enterprise/:enterpriseId')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get reports by enterprise ID' })
    @ApiResponse({ status: 200, type: ReportResponseDto })
    async getByEnterprise(@Param('enterpriseId') enterpriseId: string): Promise<ReportResponseDto> {
        return await this.reportService.getByEnterprise(enterpriseId);
    }
    @Get('status/:status')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get reports by status' })
    @ApiResponse({ status: 200, type: ReportResponseDto })
    async getByStatus(@Param('status') status: ReportEnterpriseStatus): Promise<ReportResponseDto> {
        return await this.reportService.getByStatus(status);
    }
}
