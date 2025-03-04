import { Module } from '@nestjs/common';
import { EnterpriseService } from './service/enterprise.service';
import { EnterpriseController } from './enterprise.controller';
import { EnterpriseRepository } from './repositories';
import { TmpModule } from '@modules/tmp/tmp.module';
import { CacheModule } from '@cache/cache.module';

@Module({
    imports: [TmpModule, CacheModule],
    controllers: [EnterpriseController],
    providers: [EnterpriseService, EnterpriseRepository],
    exports: [EnterpriseService],
})
export class EnterpriseModule {}
