import { CreateJobDtoErrorType } from '@src/common/errors/class-validator-error-type';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRecentJobDto {
    @ApiProperty({
        description: 'The unique identifier of the job',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsString({ message: CreateJobDtoErrorType.JOB_ID_NOT_STRING })
    @IsNotEmpty({ message: CreateJobDtoErrorType.JOB_ID_REQUIRED })
    jobId: string;

    @ApiProperty({
        description: 'The unique identifier of the user profile',
        example: '321e4567-e89b-12d3-a456-426614174000',
    })
    @IsString({ message: CreateJobDtoErrorType.PROFILE_ID_NOT_STRING })
    @IsNotEmpty({ message: CreateJobDtoErrorType.PROFILE_ID_REQUIRED })
    profileId: string;
}
