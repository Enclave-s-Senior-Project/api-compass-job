import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleEntity } from '@database/entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleService } from './service';
import { RoleRepository } from './repositories';

@Module({
    imports: [TypeOrmModule.forFeature([RoleEntity])],
    controllers: [RoleController],
    providers: [RoleService, RoleRepository],
    exports: [RoleService],
})
export class RoleModule {}
