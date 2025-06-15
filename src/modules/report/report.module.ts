import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './report.controller';
import { ReportService } from './services/report.service';
import { ReportEnterpriseEntity } from '@database/entities/report-enterprise.entity';
import { TmpModule } from '../tmp/tmp.module';

@Module({
    imports: [TmpModule],
    controllers: [ReportController],
    providers: [ReportService],
    exports: [ReportService],
})
export class ReportModule {}
