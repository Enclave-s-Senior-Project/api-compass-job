import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BoostedJobsEntity, EnterpriseEntity } from '@src/database/entities';
import { BoostJobService } from '../boost-job/boost-job.service';

export type BoostJobExpiredData = {
    jobId: string;
    jobName: string;
    enterprise: Pick<EnterpriseEntity, 'enterpriseId' | 'email' | 'name'>;
};
@Injectable()
export class BoostJobCronService {
    constructor(
        @InjectQueue('boostJob-expired') private readonly boostJobExpiredQueue: Queue,
        private readonly boostJobService: BoostJobService
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async triggerUpdateBoostJobExpired() {
        this.handleCronBoostJob();
    }

    private async handleCronBoostJob() {
        const batchSize = 1;
        let jobs: BoostedJobsEntity[] = [];

        do {
            jobs = await this.boostJobService.batchUnexpiredBoostJob(batchSize, 0);
            if (jobs.length > 0) {
                // Process expired jobs
                await this.handleFilterExpiredBoostJob(jobs);
            }
        } while (jobs.length > 0);
    }

    private async handleFilterExpiredBoostJob(jobs: BoostedJobsEntity[]) {
        const now = new Date();

        // Filter expired jobs
        const expiredJobs = jobs.filter((job) => new Date(job.createdAt) <= now);

        if (expiredJobs.length > 0) {
            console.log('Expired jobs:', expiredJobs);
            // Update expired jobs in the database
            await this.boostJobService.deleteBulkBoostedJobs(expiredJobs);

            // Add expired jobs to the BullMQ queue
            await this.boostJobExpiredQueue.addBulk(
                expiredJobs.map<{ name: string; data: BoostJobExpiredData }>((temp) => ({
                    name: `expired-boost-job-${temp.job?.jobId}`,
                    data: {
                        jobId: temp.job?.jobId,
                        jobName: temp.job?.name,
                        enterprise: {
                            enterpriseId: temp.job?.enterprise?.enterpriseId,
                            email: temp.job?.enterprise?.email,
                            name: temp.job?.enterprise?.name,
                        },
                    },
                }))
            );
        }
    }
}
