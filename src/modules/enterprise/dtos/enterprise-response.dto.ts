import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class EnterpriseResponseDto extends BaseResponseDto {}

export class EnterpriseResponseDtoBuilder extends BaseResponseDtoBuilder<EnterpriseResponseDto> {
    constructor() {
        super(EnterpriseResponseDto);
    }
}
