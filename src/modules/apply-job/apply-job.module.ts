import { forwardRef, Module } from '@nestjs/common';
import { ApplyJobService } from './services/apply-job.service';
import { ApplyJobController } from './apply-job.controller';
import { TmpModule } from '@modules/tmp/tmp.module';
import { ApplyJobRepository } from './repositories/apply-job.repository';
import { CvModule } from '@modules/cv/cv.module';
import { JobModule } from '@modules/job/job.module';
import { UserModule } from '../user/user.module';
import { NotificationModule } from '../notification/notification.module';
import { MailModule } from '@src/mail/mail.module';

@Module({
    imports: [TmpModule, CvModule, JobModule, forwardRef(() => UserModule), NotificationModule, MailModule],
    controllers: [ApplyJobController],
    providers: [ApplyJobService, ApplyJobRepository],
    exports: [ApplyJobService],
})
export class ApplyJobModule {}
