import { Body, Controller, Post } from '@nestjs/common';
import { FcmTokenService } from './fcm-token.service';
import { CreateFcmTokenDto } from './dtos/create-fcm-token.dto';
import { CurrentUser, TOKEN_NAME } from '../auth';
import { JwtPayload } from '@src/common/dtos';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller({ path: 'fcm-token', version: '1' })
export class FcmTokenController {
    constructor(private readonly fcmTokenService: FcmTokenService) {}

    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ summary: 'Create a new FCM token' })
    @ApiResponse({ status: 201, description: 'SUCCESS' })
    @ApiResponse({ status: 500, description: 'INTERNAL_SERVER_ERROR' })
    @Post('')
    async create(@CurrentUser() user: JwtPayload, @Body() payload: CreateFcmTokenDto) {
        return this.fcmTokenService.create(user.accountId, payload);
    }
}
