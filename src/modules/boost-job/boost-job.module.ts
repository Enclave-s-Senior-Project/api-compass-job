import { Module } from '@nestjs/common';
import { BoostJobService } from './boost-job.service';
import { BoostJobController } from './boost-job.controller';
import { JobModule } from '@modules/job/job.module';
import { EnterpriseModule } from '@modules/enterprise/enterprise.module';
import { BoostJobRepository } from './repositories/boost-job.repository';
import { TmpModule } from '@modules/tmp/tmp.module';
import { CacheModule } from '@src/cache/cache.module';

@Module({
    imports: [JobModule, EnterpriseModule, TmpModule, CacheModule],
    controllers: [BoostJobController],
    providers: [BoostJobService, BoostJobRepository],
})
export class BoostJobModule {}
