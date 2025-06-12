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
        default: 'Jun 08, 2003',
    })
    // @IsDateString()
    @IsOptional()
    readonly dateOfBirth: Date;

    @ApiProperty({
        default: 'd08782d2-d852-4b49-8ab8-b478855fa191',
    })
    @IsOptional()
    readonly industryId: string;

    @ApiProperty({
        default: '5816de0c-66df-400d-a3de-608d71793aef',
    })
    @IsOptional()
    readonly majorityId: string;

    @ApiProperty({
        default: 'MALE',
    })
    @IsNotEmpty({ message: UpdateCandidateProfileDtoErrorType.GENDER_REQUIRED })
    @IsOptional()
    readonly gender: GenderType;

    @ApiProperty({
        default: 'ALONE',
    })
    @IsOptional()
    readonly maritalStatus?: MaritalStatusType;

    @ApiProperty({
        default: 'Hello',
    })
    @IsOptional()
    readonly introduction?: string;
}
