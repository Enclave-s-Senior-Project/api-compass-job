import { CreateFcmTokenDtoErrorType } from '@src/common/errors/class-validator-error-type';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFcmTokenDto {
    @ApiProperty({
        description: 'The FCM token used for push notifications.',
        example: 'dXNlci10b2tlbi1leGFtcGxl',
    })
    @IsString({ message: CreateFcmTokenDtoErrorType.TOKEN_INVALID })
    @IsNotEmpty({ message: CreateFcmTokenDtoErrorType.TOKEN_REQUIRED })
    token: string;
}
