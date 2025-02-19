import { Module } from '@nestjs/common';
import { TagService } from './services';
import { TagController } from './tag.controller';
import { TmpModule } from '@modules/tmp/tmp.module';
import { TagRepository } from './repositories';

@Module({
    imports: [TmpModule],
    controllers: [TagController],
    providers: [TagService, TagRepository],
})
export class TagModule {}
