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
}
