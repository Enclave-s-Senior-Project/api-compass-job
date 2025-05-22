import { forwardRef, Module } from '@nestjs/common';
import { JobService } from './service/job.service';
import { JobController } from './job.controller';
import { JobToolsController } from './job-tools.controller';
import { CacheModule } from 'src/cache/cache.module';
import { JobRepository, RecentJobRepository } from './repositories';
import { TmpModule } from '@modules/tmp/tmp.module';
import { TagModule } from '@modules/tag/tag.module';
import { CategoryModule } from '@modules/category/category.module';
import { AddressModule } from '@modules/address/address.module';
import { EnterpriseModule } from '@modules/enterprise/enterprise.module';
import { BoostJobModule } from '../boost-job/boost-job.module';
import { MailModule } from '@src/mail/mail.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { RecentJobService } from './service/recent-job.service';

@Module({
    imports: [
        TmpModule,
        CacheModule,
        TagModule,
        CategoryModule,
        AddressModule,
        forwardRef(() => EnterpriseModule),
        forwardRef(() => BoostJobModule),
        forwardRef(() => EmbeddingModule),
        MailModule,
    ],
    controllers: [JobController, JobToolsController],
    providers: [JobService, JobRepository, RecentJobService, RecentJobRepository],
    exports: [JobService, RecentJobService],
})
export class JobModule {}
