import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationEntity } from '@src/database/entities';
import { NotificationType } from '@src/database/entities/notification.entity';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, SkipAuth, TOKEN_NAME } from '../auth';
import { JwtPayload, PaginationDto } from '@src/common/dtos';
import { MarkAsReadDto } from './dto/mark-as-read.dto';

@ApiTags('Notifications')
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

    @Get('')
    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ summary: 'Get all notifications for a user' })
    @ApiResponse({ status: 200, description: 'Returns paginated notifications.' })
    getNotifications(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
        return this.notificationService.getNotifications(user.accountId, pagination);
    }

    @Get(':notificationId')
    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ summary: 'Get a specific notification by ID' })
    @ApiResponse({ status: 200, description: 'Returns the notification details.' })
    @ApiResponse({ status: 404, description: 'Notification not found.' })
    @ApiParam({ name: 'notificationId', description: 'The ID of the notification to retrieve' })
    getNotificationById(@CurrentUser() user: JwtPayload, @Param('notificationId') notificationId: string) {
        return this.notificationService.getNotificationById(user.accountId, notificationId);
    }

    @Get('status/unread')
    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ summary: 'Check if user has unread notifications' })
    @ApiResponse({ status: 200, description: 'Returns whether user has unread notifications.' })
    hasNotification(@CurrentUser() user: JwtPayload) {
        return this.notificationService.hasNotification(user.accountId);
    }

    @Patch('mark-read')
    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ summary: 'Mark specific notifications as read' })
    @ApiResponse({ status: 200, description: 'Notifications marked as read successfully.' })
    markAsRead(@CurrentUser() user: JwtPayload, @Body() markAsReadDto: MarkAsReadDto) {
        return this.notificationService.markAsRead(user.accountId, markAsReadDto.notificationIds);
    }

    @Patch('mark-all-read')
    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ summary: 'Mark all notifications as read for a user' })
    @ApiResponse({ status: 200, description: 'All notifications marked as read successfully.' })
    markAsReadAll(@CurrentUser() user: JwtPayload) {
        return this.notificationService.markAsReadAll(user.accountId);
    }
}
