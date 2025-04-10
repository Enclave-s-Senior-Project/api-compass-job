import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class MarkAsReadDto {
    @ApiProperty({
        description: 'Array of notification IDs to mark as read',
        example: ['notification-id-1', 'notification-id-2'],
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    notificationIds: string[];
}
