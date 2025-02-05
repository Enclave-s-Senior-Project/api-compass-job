import { Module } from '@nestjs/common';
import { UserService } from './service/enterprise.service';
import { UserController } from './enterprise.controller';
import { ProfileEntity } from '@database/entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileRepository } from './repositories';

@Module({
    imports: [TypeOrmModule.forFeature([ProfileEntity])],
    controllers: [UserController],
    providers: [UserService, ProfileRepository],
    exports: [UserService],
})
export class UserModule {}
