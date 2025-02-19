import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { JobService } from './service/job.service';
import { JobController } from './job.controller';
import { JobEntity } from '@database/entities';
import { CacheModule } from 'src/cache/cache.module';
import { JobRepository } from './repositories';

@Module({
    imports: [TypeOrmModule.forFeature([JobEntity]), CacheModule],
    controllers: [JobController],
    providers: [JobService, JobRepository],
    exports: [JobService],
})
export class JobModule {}
