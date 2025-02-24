import { Controller, Get, Query } from '@nestjs/common';
import { AwsService } from './services';
import { SkipAuth } from '@modules/auth';

@Controller('upload')
export class AwsController {
    constructor(private readonly awsService: AwsService) {}
    @SkipAuth()
    @Get('hello-url')
    async testAPI() {
        return 'Hello World!';
    }
    @SkipAuth()
    @Get('presigned-url')
    async getPresignedUrl(@Query('filename') filename: string, @Query('contentType') contentType: string) {
        const key = `uploads/${Date.now()}-${filename}`;
        const url = await this.awsService.generatePresignedUrl(key, contentType);
        return { url, key };
    }
}
