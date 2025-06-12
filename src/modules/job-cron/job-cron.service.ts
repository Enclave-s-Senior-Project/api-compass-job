import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobService } from '../job/service/job.service';
import { EnterpriseEntity, JobEntity } from '@src/database/entities';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '@src/database/entities/notification.entity';
import { CacheService } from '@src/cache/cache.service';
import { EmbeddingService } from '../embedding/embedding.service';

export type JobExpiredData = {
    jobId: string;
    jobName: string;
    deadline: Date;
    enterprise: Pick<EnterpriseEntity, 'enterpriseId' | 'email' | 'name'>;
};

@Injectable()
export class JobCronService {
    private readonly logger = new Logger(JobCronService.name);

    constructor(
        @InjectQueue('job-expired') private readonly jobExpiredQueue: Queue,
        private readonly jobService: JobService,
        private readonly notificationService: NotificationService,
        private readonly cacheService: CacheService,
        private readonly embeddingService: EmbeddingService
    ) {}

    @Cron(CronExpression.EVERY_5_HOURS)
    async triggerUpdateJobExpired() {
        try {
            await this.handleCronJob();
        } catch (error) {
            this.logger.error(`Cron job failed: ${error.message}`, error.stack);
        }
    }

    private async handleCronJob() {
        const batchSize = 100;
        const expiredJobs: JobEntity[] = [];

        let offset = 0;
        let batch: JobEntity[];

        do {
            try {
                batch = await this.jobService.batchExpiredJobs(batchSize, offset);
                expiredJobs.push(...batch);
                offset += batchSize;
            } catch (error) {
                this.logger.error(`Error fetching batch at offset ${offset}: ${error.message}`, error.stack);
                break;
            }
        } while (batch.length === batchSize);

        if (expiredJobs.length > 0) {
            await this.handleFilterExpiredJob(expiredJobs);
        }
        if (expiredJobs.length === 0) {
            this.logger.log('No expired jobs found');
        }
        this.logger.log(`Successfully processed ${expiredJobs.length} expired jobs.`);
    }

    private async handleFilterExpiredJob(jobs: JobEntity[]) {
        if (!jobs.length) return;

        try {
            this.logger.log(`Processing ${jobs.length} expired jobs...`);

            await this.jobService.updateBulkJobExpired(jobs);

            const queueJobs = jobs.map<{ name: string; data: JobExpiredData }>((job) => ({
                name: `expired-job-${job.jobId}`,
                data: {
                    jobId: job.jobId,
                    jobName: job.name,
                    deadline: job.deadline,
                    enterprise: {
                        enterpriseId: job.enterprise.enterpriseId,
                        email: job.enterprise.email,
                        name: job.enterprise.name,
                    },
                },
            }));

            const notificationPayloads = jobs.map((job) =>
                this.notificationService.create({
                    accountId: job.enterprise.account.accountId,
                    type: NotificationType.JOB_EXPIRED,
                    title: `Job ${job.name} has expired`,
                    message: 'Your job has expired.',
                    link: `/single-job/${job.jobId}`,
                })
            );

            const batchSize = 50;
            for (let i = 0; i < queueJobs.length; i += batchSize) {
                const queueBatch = queueJobs.slice(i, i + batchSize);
                const notificationBatch = notificationPayloads.slice(i, i + batchSize);

                await Promise.all([
                    this.jobExpiredQueue.addBulk(queueBatch),
                    Promise.all(notificationBatch),
                    this.cacheService.removeEnterpriseSearchJobsCache(),
                    this.cacheService.removeSearchJobsCache(),
                    this.embeddingService.deleteManyJobEmbedding(jobs.map((job) => job.jobId)),
                ]);
            }
            await Promise.all(
                jobs.map(async (job) => {
                    await this.embeddingService.createJobEmbedding(job.jobId);
                })
            );
            this.logger.log(`Successfully processed ${jobs.length} expired jobs.`);
        } catch (error) {
            this.logger.error(`Error handling expired jobs: ${error.message}`, error.stack);
        }
    }
}
