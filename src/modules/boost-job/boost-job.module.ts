import { forwardRef, Module } from '@nestjs/common';
import { BoostJobService } from './boost-job.service';
import { BoostJobController } from './boost-job.controller';
import { JobModule } from '@modules/job/job.module';
import { EnterpriseModule } from '@modules/enterprise/enterprise.module';
import { BoostJobRepository } from './repositories/boost-job.repository';
import { TmpModule } from '@modules/tmp/tmp.module';
import { CacheModule } from '@src/cache/cache.module';

@Module({
    imports: [EnterpriseModule, TmpModule, CacheModule, forwardRef(() => JobModule)],
    controllers: [BoostJobController],
    providers: [BoostJobService, BoostJobRepository],
    exports: [BoostJobService],
})
export class BoostJobModule {}
