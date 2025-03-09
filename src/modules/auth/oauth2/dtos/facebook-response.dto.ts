import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class FacebookResponseDto extends BaseResponseDto {}

export class FacebookResponseDtoBuilder extends BaseResponseDtoBuilder<FacebookResponseDto> {
    constructor() {
        super(FacebookResponseDto);
    }
}
