import * as firebase from 'firebase-admin';
import { Messaging } from 'firebase-admin/messaging';
import { Inject, Injectable } from '@nestjs/common';
import { firebaseAdminProviderName } from './providers/firebase.provider';
import { NotificationRepository } from './repositories/notification.repository';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import { NotificationEntity } from '@src/database/entities';
import { FcmTokenService } from '../fcm-token/fcm-token.service';
import { PageDto, PageMetaDto, PaginationDto } from '@src/common/dtos';
import { NotificationResponseDtoBuilder } from './dto/notification-response.dto';
import { In } from 'typeorm';

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
            const notification = this.notificationRepository.create({
                account: {
                    accountId: payload.accountId,
                },
                ...payload,
            });
            await this.notificationRepository.save(notification);
            return notification;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async sendNotification(token: string, payload: NotificationEntity) {
        if (!token) {
            return;
        }

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
        if (tokens.length === 0) {
            return;
        }

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

            return response;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async getNotifications(accountId: string, pagination: PaginationDto) {
        try {
            const [notifications, total] = await this.notificationRepository.findAndCount({
                where: {
                    account: {
                        accountId: accountId,
                    },
                },
                relations: {
                    account: true,
                },
                select: {
                    notificationId: true,
                    type: true,
                    isRead: true,
                    createdAt: true,
                    link: true,
                    message: true,
                    title: true,
                    account: {
                        accountId: true,
                    },
                },
                order: {
                    createdAt: 'DESC',
                },
                skip: pagination.skip,
                take: pagination.take,
            });

            const meta: PageMetaDto = new PageMetaDto({
                itemCount: total,
                pageOptionsDto: pagination,
            });

            return new NotificationResponseDtoBuilder()
                .setValue(new PageDto<NotificationEntity>(notifications, meta))
                .success()
                .build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async getNotificationById(accountId: string, notificationId: string) {
        try {
            const notification = await this.notificationRepository.findOne({
                where: {
                    notificationId: notificationId,
                    account: {
                        accountId: accountId,
                    },
                },
                relations: {
                    account: true,
                },
                select: {
                    notificationId: true,
                    type: true,
                    isRead: true,
                    createdAt: true,
                    link: true,
                    message: true,
                    title: true,
                    account: {
                        accountId: true,
                    },
                },
            });

            return new NotificationResponseDtoBuilder().setValue(notification).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async hasNotification(accountId: string) {
        try {
            const result = await this.notificationRepository.exists({
                where: {
                    account: {
                        accountId: accountId,
                    },
                    isRead: false,
                },
            });

            return new NotificationResponseDtoBuilder().setValue(result).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async markAsRead(accountId: string, notificationIds: string[]) {
        try {
            const notifications = await this.notificationRepository.find({
                where: {
                    account: {
                        accountId: accountId,
                    },
                    notificationId: In(notificationIds),
                },
            });

            notifications.forEach((notification) => {
                notification.isRead = true;
            });

            await this.notificationRepository.save(notifications);

            return new NotificationResponseDtoBuilder().setValue(notifications).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async markAsReadAll(accountId: string) {
        try {
            await this.notificationRepository.update(
                {
                    account: {
                        accountId: accountId,
                    },
                },
                {
                    isRead: true,
                }
            );

            return new NotificationResponseDtoBuilder().setValue(null).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
