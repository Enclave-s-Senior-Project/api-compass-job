import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AuthModule } from '../auth/auth.module';
import { EnterpriseModule } from '../enterprise/enterprise.module';
import { UserModule } from '../user/user.module';
import { JobModule } from '../job/job.module';
import { ApplyJobModule } from '../apply-job/apply-job.module';
import { HistoryTransactionModule } from '../history-transaction/history-transaction.module';

@Module({
    imports: [AuthModule, EnterpriseModule, UserModule, JobModule, ApplyJobModule, HistoryTransactionModule],
    controllers: [DashboardController],
    providers: [DashboardService],
    exports: [DashboardService],
})
export class DashboardModule {}
