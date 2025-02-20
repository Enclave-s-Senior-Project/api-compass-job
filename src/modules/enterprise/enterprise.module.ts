import { Module } from '@nestjs/common';
import { EnterpriseService } from './service/enterprise.service';
import { EnterpriseController } from './enterprise.controller';
import { EnterpriseEntity } from '@database/entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnterpriseRepository } from './repositories';
import { TmpModule } from '@modules/tmp/tmp.module';

@Module({
    imports: [TmpModule],
    controllers: [EnterpriseController],
    providers: [EnterpriseService, EnterpriseRepository],
    exports: [EnterpriseService],
})
export class EnterpriseModule {}
