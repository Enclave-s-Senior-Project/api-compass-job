import { Module } from '@nestjs/common';
import { UserService } from './service/user.service';
import { UserController } from './user.controller';
import { ProfileRepository } from './repositories';
import { CacheModule } from 'src/cache/cache.module';
import { TmpModule } from '@modules/tmp/tmp.module';
import { ImagekitService } from '@imagekit/imagekit.service';
import { ImagekitModule } from '@imagekit/imagekit.module';

@Module({
    imports: [TmpModule, CacheModule, ImagekitModule],
    controllers: [UserController],
    providers: [UserService, ProfileRepository, ImagekitService],
    exports: [UserService],
})
export class UserModule {}
