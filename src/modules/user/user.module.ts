import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './service/user.service';
import { UserController } from './user.controller';
import { ProfileRepository } from './repositories';
import { CacheModule } from 'src/cache/cache.module';
import { TmpModule } from '@modules/tmp/tmp.module';
import { CategoryModule } from '@modules/category/category.module';
import { CvModule } from '../cv/cv.module';
import { WebsiteModule } from '../website/website.module';
import { ApplyJobModule } from '../apply-job/apply-job.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '@src/mail/mail.module';
@Module({
    imports: [
        TmpModule,
        CacheModule,
        CategoryModule,
        CvModule,
        WebsiteModule,
        forwardRef(() => ApplyJobModule),
        forwardRef(() => AuthModule),
        MailModule,
    ],
    controllers: [UserController],
    providers: [UserService, ProfileRepository],
    exports: [UserService],
})
export class UserModule {}
