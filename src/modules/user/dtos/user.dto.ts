import { ApiProperty } from '@nestjs/swagger';
import { GenderType } from '@database/entities/profile.entity';

export class UserDto {
    @ApiProperty({ example: 'd3b07384-d9c5-4a42-8b66-7dbf56f61d11' })
    profileId: string;

    @ApiProperty({ example: 'John Doe' })
    fullName: string;

    @ApiProperty({ example: 'https://example.com/avatar.jpg', nullable: true })
    avatarUrl: string;

    @ApiProperty({ example: 'https://example.com/page.jpg', nullable: true })
    pageUrl: string;

    @ApiProperty({ example: 'Software Engineer with 5 years of experience', nullable: true })
    introduction: string | null;

    @ApiProperty({ example: '+1234567890', nullable: true })
    phone: string | null;

    @ApiProperty({ example: 100 })
    view: number;

    @ApiProperty({ enum: GenderType, example: GenderType.MALE, nullable: true })
    gender: GenderType | null;

    @ApiProperty({ example: 'Master’s in Computer Science', nullable: true })
    education: string | null;

    @ApiProperty({ example: true })
    isPremium: boolean;

    @ApiProperty({ example: '2025-12-31', nullable: true })
    expiredPremium: Date | null;

    @ApiProperty({ example: '5 years in backend development', nullable: true })
    experience: string | null;
}
