import { forwardRef, Module } from '@nestjs/common';
import { JobModule } from '../job/job.module';
import { EnterpriseModule } from '../enterprise/enterprise.module';
import { EmbeddingService } from './embedding.service';

@Module({
    imports: [forwardRef(() => JobModule), forwardRef(() => EnterpriseModule)],
    providers: [EmbeddingService],
    exports: [EmbeddingService],
})
export class EmbeddingModule {}
