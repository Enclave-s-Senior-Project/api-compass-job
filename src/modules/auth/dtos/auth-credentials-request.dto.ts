import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AuthCredentialsRequestDto {
    @IsNotEmpty()
    @ApiProperty({
        example: 'nhatlinh.dut.1@gmail.com',
    })
    readonly username: string;

    @IsNotEmpty()
    @ApiProperty({
        example: 'StrongP@ss1',
    })
    readonly password: string;
}
