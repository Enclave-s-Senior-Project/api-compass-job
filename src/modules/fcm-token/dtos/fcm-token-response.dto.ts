import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class FCMResponseDto extends BaseResponseDto {}

export class FCMResponseDtoBuilder extends BaseResponseDtoBuilder<FCMResponseDto> {
    constructor() {
        super(FCMResponseDto);
    }
}
