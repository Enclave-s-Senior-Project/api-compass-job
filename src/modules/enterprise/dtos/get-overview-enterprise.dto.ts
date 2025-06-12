import { GetOverviewEnterpriseDtoErrorType } from '@src/common/errors/class-validator-error-type';
import { IsOptional, IsString } from 'class-validator';

export class GetOverviewEnterpriseDto {
    @IsString({ message: GetOverviewEnterpriseDtoErrorType.NAME_NOT_STRING })
    @IsOptional()
    readonly name?: string;
}
