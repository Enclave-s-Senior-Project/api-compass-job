import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { JobService } from './service/job.service';
import { JobController } from './job.controller';
import { JobEntity } from '@database/entities';
import { CacheModule } from 'src/cache/cache.module';
import { JobRepository } from './repositories';
import { TmpModule } from '@modules/tmp/tmp.module';
import { TagModule } from '@modules/tag/tag.module';
import { CategoryModule } from '@modules/category/category.module';
import { AddressModule } from '@modules/address/address.module';
import { EnterpriseModule } from '@modules/enterprise/enterprise.module';

@Module({
    imports: [TmpModule, CacheModule, TagModule, CategoryModule, AddressModule, EnterpriseModule],
    controllers: [JobController],
    providers: [JobService, JobRepository],
    exports: [JobService],
})
export class JobModule {}
