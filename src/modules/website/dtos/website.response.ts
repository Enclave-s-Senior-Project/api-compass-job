import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class WebsiteResponseDto extends BaseResponseDto {}

export class WebsiteResponseDtoBuilder extends BaseResponseDtoBuilder<WebsiteResponseDto> {
    constructor() {
        super(WebsiteResponseDto);
    }
}
