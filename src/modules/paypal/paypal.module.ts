import { Module } from '@nestjs/common';
import { PaypalService } from './services/paypal.service';
import { PaypalController } from './paypal.controller';

@Module({
    controllers: [PaypalController],
    providers: [PaypalService],
})
export class PaypalModule {}
