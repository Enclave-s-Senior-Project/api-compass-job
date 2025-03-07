import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class GoogleResponseDto extends BaseResponseDto {}

export class FacebookResponseDtoBuilder extends BaseResponseDtoBuilder<GoogleResponseDto> {
    constructor() {
        super(GoogleResponseDto);
    }
}
