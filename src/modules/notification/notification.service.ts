import * as firebase from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import { Messaging } from 'firebase-admin/messaging';
import { Inject, Injectable } from '@nestjs/common';
import { firebaseAdminProviderName } from './providers/firebase.provider';
import { NotificationRepository } from './repositories/notification.repository';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import { NotificationEntity } from '@src/database/entities';
import { FcmTokenService } from '../fcm-token/fcm-token.service';

@Injectable()
export class NotificationService {
    constructor(
        @Inject(firebaseAdminProviderName) private readonly firebase: firebase.app.App,
        private readonly notificationRepository: NotificationRepository,
        private readonly fcmTokenService: FcmTokenService
    ) {}

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

    public async sendNotification(token: string, payload: NotificationEntity) {
        try {
            const response = await this.messaging.send({
                token: token,
                notification: {
                    body: payload.message,
                    title: payload.notificationId,
                },
            });
            return response;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async sendNotificationToMany(payload: NotificationEntity, tokens: string[]) {
        try {
            const response = await this.messaging.sendEachForMulticast({
                tokens: tokens,
                notification: {
                    body: payload.message,
                    title: payload.title,
                },
                webpush: {
                    notification: {
                        data: payload,
                    },
                },
            });

            const failedTokens: string[] = [];

            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });

            this.fcmTokenService.deleteTokenWithoutAccountId(failedTokens);

            return response;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
