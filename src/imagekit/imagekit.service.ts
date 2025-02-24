import { Inject, Injectable } from '@nestjs/common';
import { imagekitProviderName } from './imagekit.provider';
import ImageKit from 'imagekit';
import { UploadOptions, UploadResponse } from 'imagekit/dist/libs/interfaces';

@Injectable()
export class ImagekitService {
    constructor(@Inject(imagekitProviderName) private readonly imagekit: ImageKit) {}
    public async uploadAvatarImage(uploadOptions: UploadOptions): Promise<UploadResponse> {
        console.log(`Upload avatar image at: ${new Date()}`);
        return await this.imagekit.upload(uploadOptions);
    }

    public async uploadPageImage(uploadOptions: UploadOptions): Promise<UploadResponse> {
        console.log(`Upload avatar background at: ${new Date()}`);
        return await this.imagekit.upload(uploadOptions);
    }
}
