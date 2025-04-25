import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailSenderService } from '@src/mail/mail.service';
import { BoostJobExpiredData } from '../boost-job-cron.service';

@Processor('job-expired')
export class BoostJobExpiredProcessor extends WorkerHost {
    private readonly logger = new Logger(BoostJobExpiredProcessor.name);
    constructor(private readonly mailService: MailSenderService) {
        super();
    }

    async process(job: Job<BoostJobExpiredData, any, string>): Promise<any> {
        try {
            // Send email notification
            await this.mailService.sendNotificationBoostJobExpiredMail(job.data);
            return { processed: true };
        } catch (error) {
            this.logger.error(`Failed to process expired job notification: ${error.message}`, error.stack);
            throw error; // Rethrow to retry the job
        }
    }
}
