import { ApiProperty } from '@nestjs/swagger';
import { JobStatusEnum } from '@src/common/enums/job.enum';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateJobStatusDto {
    @IsNotEmpty()
    @IsEnum(JobStatusEnum)
    @ApiProperty({
        description: 'Job status',
        enum: JobStatusEnum,
        example: JobStatusEnum.OPEN,
    })
    status: JobStatusEnum;

    @ApiProperty({
        description: 'Reason for status change',
        example: 'Job is no longer available',
        required: false,
    })
    @IsString()
    @IsOptional()
    reason?: string;
}
