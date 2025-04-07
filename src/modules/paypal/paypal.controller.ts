import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiInternalServerErrorResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser, SkipAuth } from '@modules/auth';
import { PaypalService } from './services/paypal.service';

@ApiTags('Paypal')
@Controller({ path: 'paypal', version: '1' })
export class PaypalController {
    constructor(private readonly paypalService: PaypalService) {}
    @SkipAuth()
    @ApiOperation({ description: 'Create PayPal order' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Post('create-order')
    async createOrder(): Promise<string> {
        return this.paypalService.createOrder();
    }

    @ApiBearerAuth('Bearer')
    @ApiOperation({ description: 'Capture PayPal payment' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Post('capture-payment/:orderId')
    async capturePayment(@Param('orderId') orderId: string): Promise<any> {
        return this.paypalService.capturePayment(orderId);
    }

    @SkipAuth()
    @HttpCode(200)
    @ApiOperation({ description: 'Get PayPal order details by ID' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get('order/:id')
    async getOrderDetails(@Param('id') id: string): Promise<any> {
        return this.paypalService.getOrderDetails(id);
    }

    @SkipAuth()
    @HttpCode(200)
    @Get('complete-order')
    async completeOrder(@Query('token') token: string, @Query('PayerID') payerId: string) {
        console.log('Payment completed with token:', token, 'and PayerID:', payerId);
        return 'Payment completed';
    }

    @SkipAuth()
    @HttpCode(200)
    @Get('cancel-order')
    async cancelOrder(@Query('token') token: string) {
        console.log('Order canceled with token:', token);
        return 'Payment canceled';
    }
}
