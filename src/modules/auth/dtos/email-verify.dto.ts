import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class EmailVerifyDto {
    @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
    @IsEmail({}, { message: 'EMAIL_INVALID' })
    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
    })
    readonly email: string;

    @IsNotEmpty({ message: 'CODE_REQUIRED' })
    @Matches(/^\d{6}$/, { message: 'CODE_INVALID' })
    @ApiProperty({
        description: '6-digit verification code',
        example: '123456',
    })
    readonly code: string;
}

export class EmailVerifyDtoNoCode {
    @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
    @IsEmail({}, { message: 'EMAIL_INVALID' })
    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
    })
    readonly email: string;
}
