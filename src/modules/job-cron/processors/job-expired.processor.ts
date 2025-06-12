import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobExpiredData } from '../job-cron.service';
import { MailSenderService } from '@src/mail/mail.service';

@Processor('job-expired')
export class JobExpiredProcessor extends WorkerHost {
    private readonly logger = new Logger(JobExpiredProcessor.name);
    constructor(private readonly mailService: MailSenderService) {
        super();
    }

    async process(job: Job<JobExpiredData, any, string>): Promise<any> {
        try {
            // Send email notification
            await this.mailService.sendNotificationJobExpiredMail(job.data);
            return { processed: true };
        } catch (error) {
            this.logger.error(`Failed to process expired job notification: ${error.message}`, error.stack);
            throw error; // Rethrow to retry the job
        }
    }
}
