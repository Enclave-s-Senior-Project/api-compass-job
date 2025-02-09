import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailSenderService } from './mail.service';

@Module({
    imports: [ConfigModule],
    providers: [MailSenderService],
    exports: [MailSenderService],
})
export class MailModule {}
