import { forwardRef, Module } from '@nestjs/common';
import { EnterpriseService } from './service/enterprise.service';
import { EnterpriseController } from './enterprise.controller';
import { EnterpriseRepository } from './repositories';
import { TmpModule } from '@modules/tmp/tmp.module';
import { CacheModule } from '@cache/cache.module';
import { JobModule } from '@modules/job/job.module';
import { UserModule } from '../user/user.module';
import { AddressModule } from '../address/address.module';
import { CategoryModule } from '../category/category.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { MailModule } from '@src/mail/mail.module';

@Module({
    imports: [
        TmpModule,
        forwardRef(() => JobModule),
        CategoryModule,
        forwardRef(() => UserModule),
        AddressModule,
        CacheModule,
        forwardRef(() => AuthModule),
        NotificationModule,
        MailModule,
    ],
    controllers: [EnterpriseController],
    providers: [EnterpriseService, EnterpriseRepository],
    exports: [EnterpriseService],
})
export class EnterpriseModule {}
