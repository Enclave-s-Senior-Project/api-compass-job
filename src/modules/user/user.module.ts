import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './service/user.service';
import { UserController } from './user.controller';
import { ProfileRepository } from './repositories';
import { CacheModule } from 'src/cache/cache.module';
import { TmpModule } from '@modules/tmp/tmp.module';
import { CategoryModule } from '@modules/category/category.module';
import { CategoryService } from '@modules/category/services';
import { CvModule } from '../cv/cv.module';
import { WebsiteModule } from '../website/website.module';
import { ApplyJobModule } from '../apply-job/apply-job.module';
@Module({
    imports: [TmpModule, CacheModule, CategoryModule, CvModule, WebsiteModule, forwardRef(() => ApplyJobModule)],
    controllers: [UserController],
    providers: [UserService, ProfileRepository],
    exports: [UserService],
})
export class UserModule {}
