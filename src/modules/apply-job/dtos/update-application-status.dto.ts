import { AppliedJobEntity } from '@src/database/entities';
import { IsArray, IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ApplyJobStatus } from '@src/database/entities/applied-job.entity';

class ApplicationItem implements Pick<AppliedJobEntity, 'appliedJobId' | 'status'> {
    @ApiProperty({
        description: 'Unique identifier of the applied job',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsNotEmpty()
    appliedJobId: string;

    @ApiProperty({
        description: 'Status to update for the application',
        example: 'ACCEPTED',
        enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'INTERVIEWING'],
    })
    @IsString()
    @IsNotEmpty()
    status: ApplyJobStatus;
}

export class UpdateApplicationStatusDto {
    @ApiProperty({
        description: 'Array of job applications to update',
        type: [ApplicationItem],
        example: [
            { appliedJobId: '123e4567-e89b-12d3-a456-426614174000', status: 'ACCEPTED' },
            { appliedJobId: '123e4567-e89b-12d3-a456-426614174001', status: 'REJECTED' },
        ],
    })
    @ValidateNested({ each: true })
    @Type(() => ApplicationItem)
    @IsArray()
    readonly applications: ApplicationItem[];
}
