import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
    @IsEmail({}, { message: 'EMAIL_INVALID' })
    @ApiProperty({
        example: 'user@example.com',
    })
    email: string;
    @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
        message: 'PASSWORD_WEAK',
    })
    @ApiProperty({
        example: 'StrongP@ss1',
    })
    @MaxLength(20, { message: 'PASSWORD_TOO_LONG' })
    @MinLength(8, { message: 'PASSWORD_TOO_SHORT' })
    @IsString({ message: 'PASSWORD_MUST_BE_STRING' })
    @IsNotEmpty({ message: 'PASSWORD_REQUIRED' })
    readonly newPassword: string;

    @IsString({ message: 'TOKEN_MUST_BE_STRING' })
    @IsNotEmpty({ message: 'TOKEN_REQUIRED' })
    @ApiProperty({
        example: 'a4b0758aadf9ffaf1b7ae061bac3d9e8',
    })
    readonly token: string;

    @IsString({ message: 'IV_MUST_BE_STRING' })
    @IsNotEmpty({ message: 'IV_REQUIRED' })
    @ApiProperty({
        example: 'a4b0758aadf9ffaf1b7ae061bac3d9e8',
    })
    readonly iv: string;
}
