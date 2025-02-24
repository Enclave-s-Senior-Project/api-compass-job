import { Module } from '@nestjs/common';
import { AwsService } from './services';
import { AwsController } from './upload.controller';

@Module({
    controllers: [AwsController],
    providers: [AwsService],
})
export class AwsModule {}
