import { PaginationDto } from '@common/dtos';
import { Education, Experience } from '@common/enums/candidates.enum';
import { GenderType } from '@database/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FilterCandidatesDto extends PaginationDto {
    @ApiProperty({ enum: GenderType, required: false })
    @IsOptional()
    @IsEnum(GenderType)
    gender?: GenderType;

    @ApiProperty({ enum: Education, required: false })
    @IsOptional()
    @IsEnum(Education)
    education?: Education[];

    @ApiProperty({ enum: Experience, required: false })
    @IsOptional()
    @IsEnum(Experience)
    experience?: Experience;
}
