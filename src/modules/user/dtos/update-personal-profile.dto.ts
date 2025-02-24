import { UpdatePersonalProfileDtoErrorType } from '@common/errors/class-validator-error-type';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdatePersonalProfileDto {
    @ApiProperty({
        description: 'Brief description about education',
        default: `
        <ul>
            <li><strong>Formal Education:</strong> Structured learning in schools, colleges, and universities.</li>
            <li><strong>Informal Education:</strong> Learning through life experiences, self-study, and mentorship.</li>
            <li><strong>Non-formal Education:</strong> Skill-based training outside traditional schools, such as workshops and online courses.</li>
        </ul>`,
    })
    @IsString()
    @IsOptional()
    readonly education?: string;

    @ApiProperty({
        description: 'Brief description about experience',
        default: `
        <ul>
            <li><strong>Formal Education:</strong> Structured learning in schools, colleges, and universities.</li>
            <li><strong>Informal Education:</strong> Learning through life experiences, self-study, and mentorship.</li>
            <li><strong>Non-formal Education:</strong> Skill-based training outside traditional schools, such as workshops and online courses.</li>
        </ul>`,
    })
    @IsString()
    @IsOptional()
    readonly experience?: string;

    @Matches(/^\+(?:[0-9]\x20?){6,14}[0-9]$/, { message: UpdatePersonalProfileDtoErrorType.PHONE_NUMBER_INVALID })
    @IsString()
    @IsOptional()
    readonly phone?: string;
}
