import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDate, IsNotEmpty } from 'class-validator';

export class CreateBoostJobDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Job ID to boost' })
    @IsUUID()
    @IsNotEmpty()
    jobId: string;
}
