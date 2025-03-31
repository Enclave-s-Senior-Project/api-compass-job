import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDate, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBoostJobDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Job ID to boost' })
    @IsUUID()
    @IsNotEmpty()
    jobId: string;

    @ApiProperty({ example: '2025-04-01T12:00:00Z', description: 'Boost expiration date' })
    @IsDate()
    @IsNotEmpty()
    @Transform(({ value }) => new Date(value)) // Convert string to Date object
    expiresAt: Date;
}
