import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { AwsService } from './services';
import { CurrentUser, SkipAuth, TOKEN_NAME } from '@modules/auth';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryPresignedUrlDto } from './dto/query-presign-url-cv';

@ApiTags('Upload file/images')
@Controller({ path: 'upload', version: '1' })
export class AwsController {
    constructor(private readonly awsService: AwsService) {}
    @SkipAuth()
    @Get('hello-url')
    async testAPI() {
        return 'Hello World!';
    }

    @HttpCode(200)
    @ApiBearerAuth(TOKEN_NAME)
    @Get('presigned-url/cv')
    async getPresignedUrlCV(@CurrentUser() user, @Query() query: QueryPresignedUrlDto) {
        const key = `uploads/${user.accountId}/cv_${Date.now()}-${query.filename}`;
        return await this.awsService.generatePresignedUrl(key, query['content-type'], 5 * 60);
    }

    @HttpCode(200)
    @ApiBearerAuth(TOKEN_NAME)
    @Get('presigned-url/avatar')
    async getPresignedUrl(
        @CurrentUser() user,
        @Query('filename') filename: string,
        @Query('contentType') contentType: string
    ) {
        const key = `uploads/${user.accountId}/avatar_${Date.now()}_${filename}`;
        return await this.awsService.generatePresignedUrl(key, contentType, 5 * 60);
    }
}
