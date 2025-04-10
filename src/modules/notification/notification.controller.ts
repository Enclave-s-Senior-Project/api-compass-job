import { Body, Controller, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationEntity } from '@src/database/entities';
import { NotificationType } from '@src/database/entities/notification.entity';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipAuth } from '../auth';

@Controller({ path: 'notification', version: '1' })
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    @SkipAuth()
    @ApiOperation({ summary: 'Send a test notification' })
    @ApiResponse({ status: 201, description: 'Notification sent successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid request data.' })
    @ApiBody({
        description: 'Payload to send a test notification',
        schema: {
            type: 'object',
            properties: {
                token: {
                    type: 'string',
                    example: 'sample_device_token',
                    description: 'The device token to send the notification to',
                },
            },
            required: ['token'],
        },
    })
    @Post('notify')
    testNotify(@Body() body: { token: string }) {
        const notification: NotificationEntity = {
            account: null,
            type: NotificationType.APPLICATION_ACCEPTED,
            title: 'Test',
            message: 'Test message',
            link: '',
            isRead: false,
            notificationId: '',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return this.notificationService.sendNotification(body.token, notification);
    }
}
