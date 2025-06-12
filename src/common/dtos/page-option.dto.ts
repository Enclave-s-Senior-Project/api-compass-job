import { ProfileFilterDto } from '@modules/user/dtos/user-filter-dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum Order {
    ASC = 'ASC',
    DESC = 'DESC',
}

export class PaginationDto {
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

    get skip(): number {
        return (this.page - 1) * this.take;
    }
}
