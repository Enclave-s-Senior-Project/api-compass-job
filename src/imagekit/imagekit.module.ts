import { Module } from '@nestjs/common';
import { imagekitProvider, imagekitProviderName } from './imagekit.provider';
import { ImagekitService } from './imagekit.service';

@Module({
    providers: [imagekitProvider, ImagekitService],
    exports: [imagekitProviderName],
})
export class ImagekitModule {}
