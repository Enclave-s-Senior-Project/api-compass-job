import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class BoostJobJobResponseDto extends BaseResponseDto {}

export class BoostJobJobResponseDtoBuilder extends BaseResponseDtoBuilder<BoostJobJobResponseDto> {
    constructor() {
        super(BoostJobJobResponseDto);
    }
}
