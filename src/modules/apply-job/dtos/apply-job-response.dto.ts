import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class ApplyJobResponseDto extends BaseResponseDto {}

export class ApplyJobResponseDtoBuilder extends BaseResponseDtoBuilder<ApplyJobResponseDto> {
    constructor() {
        super(ApplyJobResponseDto);
    }
}
