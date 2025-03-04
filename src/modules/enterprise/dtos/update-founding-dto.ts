import { UpdateFoundingInfoDtoErrorType } from '@common/errors/class-validator-error-type';
import { OrganizationType } from '@database/entities/enterprise.entity';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateFoundingInfoDto {
    @IsString({ message: UpdateFoundingInfoDtoErrorType.INVALID_DESCRIPTION })
    @IsOptional()
    readonly description?: string = null;

    @IsString({ message: UpdateFoundingInfoDtoErrorType.INVALID_ENTERPRISE_BENEFITS })
    @IsOptional()
    readonly enterpriseBenefits?: string = null;

    @IsString({ message: UpdateFoundingInfoDtoErrorType.INVALID_COMPANY_VISION })
    @IsOptional()
    readonly companyVision?: string = null;

    @IsNotEmpty({ message: UpdateFoundingInfoDtoErrorType.FOUNDED_IN_REQUIRED })
    readonly foundedIn: Date;

    @IsEnum(OrganizationType, { message: UpdateFoundingInfoDtoErrorType.INVALID_ORGANIZATION_TYPE })
    @IsOptional()
    readonly organizationType?: OrganizationType = null;

    @IsString({ message: UpdateFoundingInfoDtoErrorType.INVALID_TEAM_SIZE })
    @IsOptional()
    readonly teamSize?: string = null;

    @IsString({ message: UpdateFoundingInfoDtoErrorType.INVALID_INDUSTRY_TYPE })
    @IsNotEmpty({ message: UpdateFoundingInfoDtoErrorType.INDUSTRY_TYPE_REQUIRED })
    readonly industryType: string;
}
