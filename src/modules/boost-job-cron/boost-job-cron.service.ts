import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BoostedJobsEntity, EnterpriseEntity } from '@src/database/entities';
import { BoostJobService } from '../boost-job/boost-job.service';
import { CacheService } from '@src/cache/cache.service';
import { EmbeddingService } from '../embedding/embedding.service';

export type BoostJobExpiredData = {
    jobId: string;
    jobName: string;
    enterprise: Pick<EnterpriseEntity, 'enterpriseId' | 'email' | 'name'>;
};
@Injectable()
export class BoostJobCronService {
    private readonly logger = new Logger(BoostJobCronService.name);
    constructor(
        @InjectQueue('boostJob-expired') private readonly boostJobExpiredQueue: Queue,
        private readonly boostJobService: BoostJobService,
        private readonly cacheService: CacheService,
        private readonly embeddingService: EmbeddingService
    ) {}

    @Cron(CronExpression.EVERY_5_HOURS)
    async triggerUpdateBoostJobExpired() {
        await this.handleCronBoostJob();
    }

    private async handleCronBoostJob() {
        const batchSize = 100;
        let offset = 0;
        let batch: BoostedJobsEntity[] = [];

        do {
            batch = await this.boostJobService.batchExpiredBoostJobs(batchSize, offset);
            if (batch.length > 0) {
                await this.handleFilterExpiredBoostJob(batch);
                offset += batchSize;
            }
        } while (batch.length === batchSize);
        if (batch.length === 0) {
            this.logger.log('No expired boost jobs found');
        }
        this.logger.log(`Successfully processed ${batch.length} expired boost jobs.`);
    }

    private async handleFilterExpiredBoostJob(jobs: BoostedJobsEntity[]) {
        if (!jobs.length) return;
        this.logger.log(`Processing ${jobs.length} expired boost jobs...`);

        await Promise.all([
            this.boostJobService.deleteBulkBoostedJobs(jobs),
            this.boostJobService.changeJobsIsBoostStatus(jobs),
            this.cacheService.removeEnterpriseSearchJobsCache(),
            this.cacheService.removeSearchJobsCache(),
            this.embeddingService.deleteManyJobEmbedding(jobs.map((job) => job.job?.jobId)),
        ]);

        await Promise.all(
            jobs.map(async (job) => {
                console.log('create embedding job: ', job.job?.jobId);
                await this.embeddingService.createJobEmbedding(job.job?.jobId);
            })
        );

        const queueJobs = jobs.map<{ name: string; data: BoostJobExpiredData }>((boosted) => ({
            name: `expired-boost-job-${boosted.job?.jobId}`,
            data: {
                jobId: boosted.job?.jobId,
                jobName: boosted.job?.name,
                enterprise: {
                    enterpriseId: boosted.job?.enterprise?.enterpriseId,
                    email: boosted.job?.enterprise?.email,
                    name: boosted.job?.enterprise?.name,
                },
            },
        }));

        await this.boostJobExpiredQueue.addBulk(queueJobs);
    }
}
