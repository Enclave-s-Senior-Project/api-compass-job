import { Module } from '@nestjs/common';
import { UserService } from './service/user.service';
import { UserController } from './user.controller';
import { ProfileRepository } from './repositories';
import { CacheModule } from 'src/cache/cache.module';
import { TmpModule } from '@modules/tmp/tmp.module';

@Module({
    imports: [TmpModule, CacheModule],
    controllers: [UserController],
    providers: [UserService, ProfileRepository],
    exports: [UserService],
})
export class UserModule {}
