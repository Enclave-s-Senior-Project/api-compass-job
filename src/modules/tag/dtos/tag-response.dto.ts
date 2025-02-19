import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class TagResponseDto extends BaseResponseDto {}

export class TagResponseDtoBuilder extends BaseResponseDtoBuilder<TagResponseDto> {
    constructor() {
        super(TagResponseDto);
    }
}
