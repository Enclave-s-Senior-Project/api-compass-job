import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateTransactionDto {
    @ApiProperty({ description: 'Amount paid', example: '0' })
    @IsNumber()
    @IsNotEmpty()
    readonly amountPaid: number;

    @ApiProperty({ description: 'Premium Type', example: 'TRIAL' })
    @IsString()
    @IsNotEmpty()
    readonly premiumType: string;
}
