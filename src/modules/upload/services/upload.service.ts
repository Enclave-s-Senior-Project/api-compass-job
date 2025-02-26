import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UploadResponseDtoBuilder } from '../dto/upload-response-builder.dto';

@Injectable()
export class AwsService {
    private readonly s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });

    async generatePresignedUrl(key: string, contentType: string) {
        try {
            const command = new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: key,
                ContentType: contentType,
            });

            const url = await getSignedUrl(this.s3, command, { expiresIn: 5 * 60 }); // URL valid for 5 minutes
            return new UploadResponseDtoBuilder().setValue({ url, key }).success().build();
        } catch (error) {
            return new UploadResponseDtoBuilder().internalServerError().build();
        }
    }
}
