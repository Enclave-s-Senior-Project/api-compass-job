import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/auth/auth.module';
import { TmpModule } from '@modules/tmp/tmp.module';
import { UserModule } from '@modules/user/user.module';
import { CacheModule } from '@cache/cache.module';
import { MailModule } from '@mail/mail.module';
import { JobModule } from '@modules/job/job.module';
import { AddressModule } from '@modules/address/address.module';
import { CategoryModule } from '@modules/category/category.module';
import { TagModule } from '@modules/tag/tag.module';
import { WebsiteModule } from '@modules/website/website.module';
import { EnterpriseModule } from '@modules/enterprise/enterprise.module';
import { AwsModule } from '@modules/upload/upload.module';

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
        EnterpriseModule,
        AddressModule,
        CategoryModule,
        TagModule,
        WebsiteModule,
        AwsModule,
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
