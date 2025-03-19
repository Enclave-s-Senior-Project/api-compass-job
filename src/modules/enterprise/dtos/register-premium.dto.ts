import { PREMIUM_TYPE } from '@database/entities/enterprise.entity';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterPremiumEnterpriseDto {
    @ApiProperty({
        description: 'Type of premium subscription',
        enum: PREMIUM_TYPE,
        example: PREMIUM_TYPE.BASIC,
    })
    @IsNotEmpty({ message: 'Premium type is required' })
    @IsEnum(PREMIUM_TYPE, { message: 'Invalid premium type' })
    readonly premiumType: PREMIUM_TYPE;
}
