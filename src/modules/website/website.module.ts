import { Module } from '@nestjs/common';
import { WebsiteService } from './services';
import { WebsiteController } from './website.controller';
import { TmpModule } from '@modules/tmp/tmp.module';
import { WebsiteRepository } from './repositories';

@Module({
    imports: [TmpModule],
    controllers: [WebsiteController],
    providers: [WebsiteService, WebsiteRepository],
    exports: [WebsiteService],
})
export class WebsiteModule {}
