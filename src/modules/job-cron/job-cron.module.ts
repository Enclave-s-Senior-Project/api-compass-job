import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { JobModule } from '../job/job.module';
import { JobCronService } from './job-cron.service';
import { JobExpiredProcessor } from './processors/job-expired.processor';
import { MailModule } from '@src/mail/mail.module';
import { BoostJobModule } from '../boost-job/boost-job.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'job-expired',
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: 100,
            },
        }),
        JobModule,
        MailModule,
    ],
    providers: [JobCronService, JobExpiredProcessor],
    exports: [JobCronService],
})
export class JobCronModule {}
