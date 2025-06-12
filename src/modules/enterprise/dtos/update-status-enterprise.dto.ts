import { EnterpriseStatus } from '@src/common/enums';
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { UpdateStatusEnterpriseDtoErrorType } from '@src/common/errors/class-validator-error-type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStatusEnterpriseDto {
    @ApiProperty({
        enum: EnterpriseStatus,
        description: 'The new status to set for the enterprise. Must be a valid EnterpriseStatus enum value.',
        example: EnterpriseStatus.ACTIVE,
    })
    @IsEnum(EnterpriseStatus, {
        message: UpdateStatusEnterpriseDtoErrorType.STATUS_INVALID,
    })
    status: EnterpriseStatus;

    @ApiPropertyOptional({
        description: 'Reason for rejection. Required if status is REJECTED.',
        example: 'Incomplete company documents',
    })
    @ValidateIf((o) => o.status === EnterpriseStatus.REJECTED || o.status === EnterpriseStatus.BLOCKED)
    @IsNotEmpty({ message: UpdateStatusEnterpriseDtoErrorType.REASON_REQUIRED })
    @IsString({ message: UpdateStatusEnterpriseDtoErrorType.REASON_NOT_STRING })
    reason?: string;
}
