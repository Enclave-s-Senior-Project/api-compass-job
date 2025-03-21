import { CreateCvErrorType } from '@common/errors/class-validator-error-type';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateCvDto {
    @ApiProperty({
        example: 'https://example.com/my_cv.pdf',
        description: 'The URL of the uploaded CV file',
        type: String,
    })
    @IsString({ message: CreateCvErrorType.CV_URL_NOT_STRING })
    @IsNotEmpty({ message: CreateCvErrorType.CV_URL_REQUIRED })
    readonly cvUrl: string;

    @ApiProperty({
        example: 'my_cv.pdf',
        description: 'The name of the CV file',
        type: String,
    })
    @IsString({ message: CreateCvErrorType.CV_NAME_NOT_STRING })
    @IsNotEmpty({ message: CreateCvErrorType.CV_NAME_REQUIRED })
    readonly cvName: string;

    @ApiProperty({
        example: true,
        description: 'Whether the CV is published or not',
        type: Boolean,
    })
    @IsBoolean({ message: CreateCvErrorType.IS_PUBLISHED_NOT_BOOLEAN })
    @Transform(({ value }) => value === 'true' || value === true)
    @IsNotEmpty({ message: CreateCvErrorType.IS_PUBLISHED_REQUIRED })
    readonly isPublished: boolean;
}
