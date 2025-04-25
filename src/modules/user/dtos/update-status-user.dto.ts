import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateStatusProfileDtoErrorType } from '@src/common/errors/class-validator-error-type';
import { UserStatus } from '@src/database/entities/account.entity';
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class UpdateStatusUserDto {
    @ApiProperty({
        enum: UserStatus,
        example: UserStatus.ACTIVE,
    })
    @IsEnum(UserStatus, {
        message: UpdateStatusProfileDtoErrorType.STATUS_INVALID,
    })
    status: UserStatus;

    @ApiPropertyOptional({
        description: 'Reason for rejection. Required if status is REJECTED.',
        example: 'Incomplete company documents',
    })
    @ValidateIf((o) => o.status === UserStatus.BLOCKED)
    @IsNotEmpty({ message: UpdateStatusProfileDtoErrorType.REASON_REQUIRED })
    @IsString({ message: UpdateStatusProfileDtoErrorType.REASON_NOT_STRING })
    reason?: string;
}
