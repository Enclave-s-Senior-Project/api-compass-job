import { GenderType } from '@database/entities';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class ProfileFilterDto {
    @ApiPropertyOptional({ description: 'Filter by name' })
    @IsString()
    @IsOptional()
    readonly fullName?: string;

    @ApiPropertyOptional({ description: 'Filter by number phone' })
    @IsString()
    @IsOptional()
    readonly phone?: string;

    @ApiPropertyOptional({ enum: GenderType, description: 'Filter by gender' })
    @IsEnum(GenderType)
    @IsOptional()
    readonly gender?: GenderType;

    @ApiPropertyOptional({ description: 'Filter by premium status' })
    @IsBoolean()
    @IsOptional()
    readonly isPremium?: boolean;

    @ApiPropertyOptional({ description: 'Filter by location' })
    @IsString()
    @IsOptional()
    readonly address?: string;
}
