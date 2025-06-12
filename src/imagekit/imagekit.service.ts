import { Inject, Injectable } from '@nestjs/common';
import { imagekitProviderName } from './imagekit.provider';
import ImageKit from 'imagekit';
import { UploadOptions, UploadResponse } from 'imagekit/dist/libs/interfaces';

@Injectable()
export class ImagekitService {
    constructor(@Inject(imagekitProviderName) private readonly imagekit: ImageKit) {}
    public async uploadAvatarImage(uploadOptions: UploadOptions): Promise<UploadResponse> {
        return this.imagekit.upload({
            ...uploadOptions,
            useUniqueFileName: true,
            folder: '/avatars',
            tags: ['avatar-image', ...(uploadOptions.tags || [])],
            transformation: {
                pre: 'width:300,height:300,quality:80',
                post: [{ type: 'thumbnail', value: 'width:100,height:100' }],
            },
            checks: `"file.size" < "2mb"`,
            isPublished: true,
        });
    }

    public async uploadPageImage(uploadOptions: UploadOptions): Promise<UploadResponse> {
        return this.imagekit.upload({
            ...uploadOptions,
            useUniqueFileName: true,
            folder: '/backgrounds',
            tags: ['background-image', ...(uploadOptions.tags || [])],
            transformation: {
                pre: 'width:1500,height:500,quality:80,crop:maintain',
                post: [{ type: 'thumbnail', value: 'width:300,height:100' }],
            },
            checks: `"file.size" < "5mb"`,
            isPublished: true,
        });
    }
}
