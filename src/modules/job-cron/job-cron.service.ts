import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobService } from '../job/service/job.service';
import { EnterpriseEntity, JobEntity } from '@src/database/entities';

export type JobExpiredData = {
    jobId: string;
    jobName: string;
    deadline: Date;
    enterprise: Pick<EnterpriseEntity, 'enterpriseId' | 'email' | 'name'>;
};

@Injectable()
export class JobCronService {
    constructor(
        @InjectQueue('job-expired') private readonly jobExpiredQueue: Queue,
        private readonly jobService: JobService
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Runs daily at midnight
    async triggerUpdateJobExpired() {
        await this.handleCronJob();
    }

    private async handleCronJob() {
        const batchSize = 1;
        let jobs: JobEntity[] = [];

        do {
            // Fetch unexpired jobs in batches
            // offset is 0 because database will be updated after each batch, so offset is meaningless
            jobs = await this.jobService.batchUnexpiredJob(batchSize, 0);

            if (jobs.length > 0) {
                // Process expired jobs
                await this.handleFilterExpiredJob(jobs);
            }
        } while (jobs.length > 0);
    }

    private async handleFilterExpiredJob(jobs: JobEntity[]) {
        const now = new Date();

        // Filter expired jobs
        const expiredJobs = jobs.filter((job) => new Date(job.deadline) <= now);

        if (expiredJobs.length > 0) {
            // Update expired jobs in the database
            await this.jobService.updateBulkJobExpired(expiredJobs);

            // Add expired jobs to the BullMQ queue
            await this.jobExpiredQueue.addBulk(
                expiredJobs.map<{ name: string; data: JobExpiredData }>((job) => ({
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
                }))
            );
        }
    }
}
