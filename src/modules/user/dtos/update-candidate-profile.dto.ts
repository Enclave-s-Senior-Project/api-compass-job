import { UpdateCandidateProfileDtoErrorType } from '@common/errors/class-validator-error-type';
import { GenderType } from '@database/entities';
import { MaritalStatusType } from '@database/entities/profile.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsDateString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateCandidateProfileDto {
    @ApiProperty({
        default: 'Vietnam',
    })
    @IsOptional()
    readonly nationality: string;

    @ApiProperty({
        default: 'MALE',
    })
    @IsNotEmpty({ message: UpdateCandidateProfileDtoErrorType.GENDER_REQUIRED })
    @IsOptional()
    readonly gender: GenderType;

    @ApiProperty({
        default: 'Hello',
    })
    @IsOptional()
    readonly introduction?: string;
}
