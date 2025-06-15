import { PaginationDto } from '@common/dtos';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReportEnterpriseStatus } from '@src/database/entities/report-enterprise.entity';
import { IsOptional, IsEnum } from 'class-validator';

export class ReportFilterDto extends PaginationDto {
    @ApiPropertyOptional({ description: 'Filter by status' })
    @IsEnum(ReportEnterpriseStatus)
    @IsOptional()
    readonly status?: ReportEnterpriseStatus;
}
