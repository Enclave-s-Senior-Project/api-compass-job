import { Module } from '@nestjs/common';
import { firebaseAdminProvider } from './providers/firebase.provider';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './repositories/notification.repository';
import { TmpModule } from '../tmp/tmp.module';

@Module({
    imports: [TmpModule],
    providers: [firebaseAdminProvider, NotificationService, NotificationRepository],
})
export class NotificationModule {}
