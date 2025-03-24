import { QueryPresignedUrlDtoErrorType } from '@common/errors/class-validator-error-type';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class QueryPresignedUrlDto {
    @ApiProperty({
        example: true,
        description: 'Whether CV is published or not',
    })
    @ApiProperty({
        example: 'my_cv.pdf',
        description: 'The name of the CV file',
    })
    @IsString({ message: QueryPresignedUrlDtoErrorType.FILENAME_NOT_STRING })
    @IsNotEmpty({ message: QueryPresignedUrlDtoErrorType.FILENAME_REQUIRED })
    readonly filename: string;

    @ApiProperty({
        example: 'application/pdf',
        description: 'The content type (MIME type) of the CV file',
    })
    @IsString({ message: QueryPresignedUrlDtoErrorType.CONTENT_TYPE_NOT_STRING })
    @IsNotEmpty({ message: QueryPresignedUrlDtoErrorType.CONTENT_TYPE_REQUIRED })
    readonly 'content-type': string;
}
