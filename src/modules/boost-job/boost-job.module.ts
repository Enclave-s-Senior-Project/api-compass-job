import { Module } from '@nestjs/common';
import { BoostJobService } from './boost-job.service';
import { BoostJobController } from './boost-job.controller';
import { JobModule } from '@modules/job/job.module';
import { EnterpriseModule } from '@modules/enterprise/enterprise.module';
import { BoostJobRepository } from './repositories/boost-job.repository';
import { TmpModule } from '@modules/tmp/tmp.module';

@Module({
    imports: [JobModule, EnterpriseModule, TmpModule],
    controllers: [BoostJobController],
    providers: [BoostJobService, BoostJobRepository],
})
export class BoostJobModule {}
