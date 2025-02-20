import { IsEnum, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SocialType } from '@database/entities';

export class CreateWebsiteDto {
    @ApiPropertyOptional({
        description: 'Type of social media platform',
        enum: SocialType,
        example: SocialType.FACEBOOK,
    })
    @IsOptional()
    @IsEnum(SocialType, { message: 'Social type must be one of the predefined values.' })
    readonly socialType?: SocialType;

    @ApiPropertyOptional({
        description: 'Link to the social media profile or website',
        example: 'https://www.facebook.com/example',
        maxLength: 255,
    })
    @IsOptional()
    @IsString()
    @Length(1, 255, { message: 'Social link must be between 1 and 255 characters.' })
    @Matches(/^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/, {
        message: 'Social link must be a valid URL.',
    })
    readonly socialLink?: string;

    @ApiPropertyOptional({
        description: 'UUID of the associated enterprise',
        example: 'e3b0c442-98fc-462c-bc19-7b9c5f6f25da',
    })
    @IsOptional()
    @IsUUID('4', { message: 'Enterprise ID must be a valid UUID.' })
    readonly enterpriseId?: string;

    @ApiPropertyOptional({
        description: 'UUID of the associated profile',
        example: '4b5b5c0a-9bcd-4f98-902d-2c3f8e6c1c99',
    })
    @IsOptional()
    @IsUUID('4', { message: 'Profile ID must be a valid UUID.' })
    readonly profileId?: string;
}
