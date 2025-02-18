import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/auth/auth.module';
import { TmpModule } from '@modules/tmp/tmp.module';
import { UserModule } from './modules/user/user.module';
import { CacheModule } from './cache/cache.module';
import { MailModule } from './mail/mail.module';
import { JobModule } from './modules/job/job.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: ['.env'],
        }),
        DatabaseModule,
        AuthModule,
        TmpModule,
        UserModule,
        CacheModule,
        MailModule,
        JobModule,
    ],
})
export class AppModule {
    static port: number;
    static apiVersion: string;
    static apiPrefix: string;

    constructor(private readonly configService: ConfigService) {
        AppModule.port = +this.configService.get('API_PORT');
        AppModule.apiVersion = this.configService.get('API_VERSION');
        AppModule.apiPrefix = this.configService.get('API_PREFIX');
    }
}
