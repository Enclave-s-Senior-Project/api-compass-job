import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, IsUUID, ArrayUnique, IsArray } from 'class-validator';

export class CreateAddressDto {
    @ApiProperty({ example: 'Vietnam', description: 'Country where the address is located.' })
    @IsNotEmpty()
    @IsString()
    @Length(1, 100)
    readonly country: string;

    @ApiProperty({ example: 'Hanoi', description: 'City of the address.' })
    @IsNotEmpty()
    @IsString()
    @Length(1, 100)
    readonly city: string;

    @ApiProperty({ example: '123 Nguyen Trai Street', description: 'Street information.' })
    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    readonly street: string;

    @ApiProperty({ example: '100000', description: 'Postal code of the address.' })
    @IsNotEmpty()
    @IsString()
    @Length(1, 10)
    readonly zipCode: string;
}
