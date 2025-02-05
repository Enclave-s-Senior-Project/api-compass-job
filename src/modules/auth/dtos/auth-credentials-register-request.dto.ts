import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, Matches, IsString, MinLength, MaxLength } from 'class-validator';

export class AuthRegisterRequestDto {
    @IsNotEmpty({ message: 'USERNAME_REQUIRED' })
    @IsString({ message: 'USERNAME_MUST_BE_STRING' })
    @MinLength(4, { message: 'USERNAME_TOO_SHORT' })
    @MaxLength(20, { message: 'USERNAME_TOO_LONG' })
    @ApiProperty({
        example: 'johndoe123',
    })
    readonly username: string;

    @IsNotEmpty({ message: 'PASSWORD_REQUIRED' })
    @IsString({ message: 'PASSWORD_MUST_BE_STRING' })
    @MinLength(8, { message: 'PASSWORD_TOO_SHORT' })
    @MaxLength(20, { message: 'PASSWORD_TOO_LONG' })
    @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
        message: 'PASSWORD_WEAK',
    })
    @ApiProperty({
        example: 'StrongP@ss1',
    })
    readonly password: string;

    @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
    @IsEmail({}, { message: 'EMAIL_INVALID' })
    @ApiProperty({
        example: 'user@example.com',
    })
    readonly email: string;

    @IsNotEmpty({ message: 'FULL_NAME_REQUIRED' })
    @IsString({ message: 'FULL_NAME_MUST_BE_STRING' })
    @MinLength(2, { message: 'FULL_NAME_TOO_SHORT' })
    @MaxLength(50, { message: 'FULL_NAME_TOO_LONG' })
    @ApiProperty({
        example: 'John Doe',
    })
    readonly full_name: string;
}
