import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseGuards, Res } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CurrentUser, SkipAuth, TOKEN_NAME } from '../auth';
import {
    ApiBearerAuth,
    ApiInternalServerErrorResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/role.guard';
import { Role, Roles } from '../auth/decorators/roles.decorator';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { ConfigService } from '@nestjs/config';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import { Response } from 'express';

@ApiTags('Transaction')
@Controller({ path: 'transaction', version: '1' })
export class TransactionController {
    constructor(
        private readonly transactionService: TransactionService,
        private readonly configService: ConfigService
    ) {}
    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ENTERPRISE)
    @ApiOperation({ description: 'Create PayPal order' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Post('create-order')
    async createOrder(@CurrentUser() user, @Body() createTransaction: CreateTransactionDto) {
        return this.transactionService.createOrder(
            user.enterpriseId,
            createTransaction.premiumType,
            createTransaction.amountPaid
        );
    }

    @ApiBearerAuth('Bearer')
    @ApiOperation({ description: 'Capture PayPal payment' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Post('capture-payment/:orderId')
    async capturePayment(@Param('orderId') orderId: string): Promise<any> {
        return this.transactionService.capturePayment(orderId);
    }

    @SkipAuth()
    @HttpCode(200)
    @ApiOperation({ description: 'Get PayPal order details by ID' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get('order/:id')
    async getOrderDetails(@Param('id') id: string): Promise<any> {
        return this.transactionService.getOrderDetails(id);
    }

    @SkipAuth()
    @Get('complete-order')
    async completeOrder(
        @Query('token') token: string,
        @Query('PayerID') payerId: string,
        @Query('premiumName') premiumName: string,
        @Query('enterpriseId') enterpriseId: string,
        @Res() res: Response
    ) {
        try {
            this.transactionService.completeOrder(premiumName, enterpriseId);
            res.redirect(`${this.configService.get<string>('CLIENT_URL_CALLBACK_TRANSACTION')}?message=success`);
        } catch (error) {
            const errorCaught = ErrorCatchHelper.serviceCatch(error);
            res.redirect(`${this.configService.get<string>('CLIENT_URL')}/sign-in?error_code=${errorCaught.message}`);
        }
    }

    @SkipAuth()
    @HttpCode(200)
    @Get('cancel-order')
    async cancelOrder(@Query('token') token: string, @Res() res: Response) {
        try {
            res.redirect(`${this.configService.get<string>('CLIENT_URL_CALLBACK_TRANSACTION')}?message=fail`);
        } catch (error) {
            const errorCaught = ErrorCatchHelper.serviceCatch(error);
            res.redirect(`${this.configService.get<string>('CLIENT_URL')}/sign-in?error_code=${errorCaught.message}`);
        }
    }
}
