import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
export class JobWishlistDto {
    @ApiPropertyOptional({ description: 'Id of user' })
    @IsString()
    @IsOptional()
    readonly userId?: string;
}
