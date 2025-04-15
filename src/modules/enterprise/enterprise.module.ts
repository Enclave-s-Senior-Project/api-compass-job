import { forwardRef, Module } from '@nestjs/common';
import { EnterpriseService } from './service/enterprise.service';
import { EnterpriseController } from './enterprise.controller';
import { EnterpriseRepository } from './repositories';
import { TmpModule } from '@modules/tmp/tmp.module';
import { CacheModule } from '@cache/cache.module';
import { JobModule } from '@modules/job/job.module';
import { UserModule } from '../user/user.module';
import { AddressModule } from '../address/address.module';

@Module({
    imports: [TmpModule, CacheModule, forwardRef(() => JobModule), forwardRef(() => UserModule), AddressModule],
    controllers: [EnterpriseController],
    providers: [EnterpriseService, EnterpriseRepository],
    exports: [EnterpriseService],
})
export class EnterpriseModule {}
