import firebase from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import { Messaging } from 'firebase-admin/messaging';
import { Inject, Injectable } from '@nestjs/common';
import { firebaseAdminProviderName } from './providers/firebase.provider';
import { NotificationRepository } from './repositories/notification.repository';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';

@Injectable()
export class NotificationService {
    constructor(
        @Inject(firebaseAdminProviderName) private readonly firebase: firebase.app.App,
        private readonly notificationRepository: NotificationRepository
    ) {}

    private get firestore(): Firestore {
        return this.firebase.firestore();
    }

    private get messaging(): Messaging {
        return this.firebase.messaging();
    }

    public async create(payload: CreateNotificationDto) {
        try {
            const notification = this.notificationRepository.create(payload);
            await this.notificationRepository.save(notification);
            return notification;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async createNotification(payload: CreateNotificationDto) {
        this.firestore.collection('notifications').add(payload);
    }
}
