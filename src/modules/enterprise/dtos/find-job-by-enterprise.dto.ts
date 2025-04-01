import { PaginationDto } from '@common/dtos';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class FindJobsByEnterpriseDto extends PaginationDto {
    @ApiPropertyOptional({
        description: 'Filter jobs by status (true for active, false for inactive)',
        type: Boolean,
        example: true,
    })
    @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : undefined))
    @IsOptional()
    status?: boolean;

    @ApiPropertyOptional({
        description: 'Filter jobs by deadline (past deadlines indicate expired jobs)',
        type: Boolean,
        example: true,
    })
    @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : undefined))
    @IsOptional()
    deadline?: boolean;
}
