import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateApplyJobDto {
    @ApiProperty({ description: 'Job ID', example: '10992003' })
    @IsString()
    @IsNotEmpty({ message: 'CV is required.' })
    readonly cvId: string;

    @ApiProperty({ description: 'Cover Letter', example: 'I want to apply' })
    @IsString()
    @IsNotEmpty({ message: 'Cover letter is required.' })
    readonly coverLetter: string;

    @ApiProperty({ description: 'Job ID', example: '10992003' })
    @IsString()
    @IsNotEmpty({ message: 'Job ID is required.' })
    readonly jobId: string;
}
