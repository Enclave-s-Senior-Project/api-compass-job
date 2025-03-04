import { UpdatePersonalProfileDtoErrorType } from '@common/errors/class-validator-error-type';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmpty, IsNotEmpty, IsOptional, IsString, IsUrl, Matches } from 'class-validator';

export class UpdatePersonalProfileDto {
    @ApiProperty({
        default: 'John Smith',
        description: 'Full name of user',
    })
    @IsString({ message: UpdatePersonalProfileDtoErrorType.FULL_NAME_REQUIRED })
    @IsNotEmpty({ message: UpdatePersonalProfileDtoErrorType.FULL_NAME_REQUIRED })
    readonly fullName: string;

    @ApiProperty({
        default: 'https://www.flaticon.com/free-icon/user-avatar_6596121',
        description: 'User avatar profile image URL',
    })
    @IsUrl({ allow_query_components: false }, { message: UpdatePersonalProfileDtoErrorType.INVALID_PROFILE_URL })
    @IsOptional()
    readonly profileUrl?: string;

    @ApiProperty({
        default:
            'https://png.pngtree.com/thumb_back/fh260/background/20210702/pngtree-blue-background-facebook-cover-png-image_736343.jpg',
        description: 'User background profile image URL',
    })
    @IsUrl({ allow_query_components: false }, { message: UpdatePersonalProfileDtoErrorType.INVALID_PAGE_URL })
    @IsOptional()
    readonly pageUrl?: string;

    @ApiProperty({
        default: 'Achieved bachelor of DUY TAN UNIVERSITY - 2025',
    })
    @IsOptional()
    readonly education?: string;

    @ApiProperty({
        default: 'Worked at Microsoft - 2020',
    })
    @IsOptional()
    readonly experience?: string;

    @ApiProperty({
        default: '+84123456789',
    })
    @IsOptional()
    @Matches(/^\+(?:[0-9]\x20?){6,14}[0-9]$/, { message: UpdatePersonalProfileDtoErrorType.PHONE_NUMBER_INVALID })
    readonly phone?: string;
}
