import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenderType } from '@src/database/entities';
import { UserStatus } from '@src/database/entities/account.entity';
import { MaritalStatusType } from '@src/database/entities/profile.entity';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum Order {
    ASC = 'ASC',
    DESC = 'DESC',
}

export class FindCandidateDto {
    @ApiPropertyOptional({ enum: Order })
    @IsEnum(Order)
    @IsOptional()
    readonly order?: Order = Order.ASC;

    @ApiPropertyOptional({ minimum: 1, default: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    readonly page?: number = 1;

    @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 10 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    @IsOptional()
    readonly take?: number = 10;

    @ApiPropertyOptional({ type: String, default: '' })
    @IsString()
    @IsOptional()
    readonly options?: any;

    @ApiProperty({
        description: 'Filter candidate by their status',
        enum: UserStatus,
        required: false,
    })
    @IsEnum(UserStatus)
    @IsOptional()
    readonly status?: UserStatus;

    @ApiProperty({
        description: 'Filter candidate by gender type',
        enum: GenderType,
        required: false,
    })
    @IsEnum(GenderType)
    @IsOptional()
    readonly gender?: GenderType;

    @ApiProperty({
        description: 'Filter candidate by marital status',
        enum: MaritalStatusType,
        required: false,
    })
    @IsEnum(MaritalStatusType)
    @IsOptional()
    readonly maritalStatus?: MaritalStatusType;

    @ApiProperty({
        description: 'Filter candidate by nation',
        required: false,
    })
    @IsString()
    @IsOptional()
    readonly nationality?: string;

    get skip(): number {
        return (this.page - 1) * this.take;
    }
}
