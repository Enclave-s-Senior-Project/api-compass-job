import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class JobResponseDto extends BaseResponseDto {}

export class JobResponseDtoBuilder extends BaseResponseDtoBuilder<JobResponseDto> {
    constructor() {
        super(JobResponseDto);
    }
}
