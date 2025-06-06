import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BoostJobModule } from '../boost-job/boost-job.module';
import { MailModule } from '@src/mail/mail.module';
import { BoostJobCronService } from './boost-job-cron.service';
import { BoostJobExpiredProcessor } from './processors/boostJob-expired.processor';
import { CacheModule } from '@src/cache/cache.module';
import { EmbeddingModule } from '../embedding/embedding.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'boostJob-expired',
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: 100,
            },
        }),
        BoostJobModule,
        MailModule,
        CacheModule,
        EmbeddingModule,
    ],
    providers: [BoostJobCronService, BoostJobExpiredProcessor],
    exports: [BoostJobCronService],
})
export class BoostJobCronModule {}
