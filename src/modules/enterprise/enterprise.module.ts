import { Module } from '@nestjs/common';
import { EnterpriseService } from './service/enterprise.service';
import { EnterpriseController } from './enterprise.controller';
import { ProfileEntity } from '@database/entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileRepository } from './repositories';

@Module({
    imports: [TypeOrmModule.forFeature([ProfileEntity])],
    controllers: [EnterpriseController],
    providers: [EnterpriseService, ProfileRepository],
    exports: [EnterpriseService],
})
export class UserModule {}
