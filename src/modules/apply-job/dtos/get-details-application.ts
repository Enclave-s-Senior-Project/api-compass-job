import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class GetDetailsApplicationDto {
    @ApiProperty({ enum: ['candidate', 'enterprise'], required: true })
    @IsEnum(['candidate', 'enterprise'])
    role: 'candidate' | 'enterprise';
}
