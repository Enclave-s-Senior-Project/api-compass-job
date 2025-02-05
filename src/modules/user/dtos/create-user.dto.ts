import { AccountEntity } from '@database/entities';
import { IsBoolean, IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

enum GenderType {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
}

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    fullName: string;

    @IsOptional()
    @IsString()
    @Length(1, 255)
    introduction?: string;

    @IsOptional()
    @IsString()
    @Length(10, 15)
    phone?: string;

    @IsOptional()
    @IsEnum(GenderType)
    gender?: GenderType;

    @IsOptional()
    @IsString()
    education?: string;

    @IsOptional()
    @IsString()
    experience?: string;

    @IsOptional()
    @IsBoolean()
    isPremium?: boolean;

    @IsOptional()
    @IsDateString()
    expiredPremium?: Date;

    @IsOptional()
    @IsNotEmpty()
    @IsEmail()
    email?: string;

    @IsString()
    @IsNotEmpty()
    account: string;
}
