import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportEnterpriseStatus } from '@database/entities/report-enterprise.entity';

export class UpdateReportDto {
    @ApiProperty({
        description: 'Status of the report',
        enum: ReportEnterpriseStatus,
        example: ReportEnterpriseStatus.REVIEWED,
    })
    @IsOptional()
    @IsEnum(ReportEnterpriseStatus)
    readonly status?: ReportEnterpriseStatus;

    @ApiProperty({
        description: 'Admin note for the report',
        example: 'Report has been reviewed and action taken',
    })
    @IsOptional()
    @IsString()
    readonly adminNote?: string;
}
