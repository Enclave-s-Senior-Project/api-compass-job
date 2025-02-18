import { AccountEntity } from '@database/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

enum GenderType {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
}

export class CreateUserDto {
    @ApiProperty({ example: 'John Doe' })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    fullName: string;

    @ApiProperty({ example: 'Software Engineer', required: false })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    introduction?: string;

    @ApiProperty({ example: '1234567890', required: false })
    @IsOptional()
    @IsString()
    @Length(10, 15)
    phone?: string;

    @ApiProperty({ example: 'MALE', enum: GenderType, required: false })
    @IsOptional()
    @IsEnum(GenderType)
    gender?: GenderType;

    @ApiProperty({ example: "Bachelor's in Computer Science", required: false })
    @IsOptional()
    @IsString()
    education?: string;

    @ApiProperty({ example: '5 years of experience', required: false })
    @IsOptional()
    @IsString()
    experience?: string;

    @ApiProperty({ example: 'johndoe@example.com', required: false })
    @IsOptional()
    @IsNotEmpty()
    @IsEmail()
    email?: string;

    @ApiProperty({ example: 'john_doe_account' })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    account: string;
}
