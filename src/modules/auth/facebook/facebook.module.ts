import { Module } from '@nestjs/common';
import { FacebookController } from './facebook.controller';

@Module({
    providers: [],
    controllers: [FacebookController],
})
export class FacebookModule {}
