import { Module } from '@nestjs/common';
import { UserService } from './service/user.service';
import { UserController } from './user.controller';
import { ProfileRepository } from './repositories';
import { CacheModule } from 'src/cache/cache.module';
import { TmpModule } from '@modules/tmp/tmp.module';
import { CategoryModule } from '@modules/category/category.module';
import { CategoryService } from '@modules/category/services';

@Module({
    imports: [TmpModule, CacheModule, CategoryModule],
    controllers: [UserController],
    providers: [UserService, ProfileRepository, CategoryService],
    exports: [UserService],
})
export class UserModule {}
