import { CreateJobWishListErrorType } from '@common/errors/class-validator-error-type';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateJobWishListDto {
    @ApiProperty({
        example: '6104179295f14b72d4524894',
    })
    @IsString({ message: CreateJobWishListErrorType.STRING_JOB_ID })
    @IsNotEmpty({ message: CreateJobWishListErrorType.REQUIRED_JOB_ID })
    readonly jobId: string;
}
