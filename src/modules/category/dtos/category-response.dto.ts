import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class CategoryResponseDto extends BaseResponseDto {}

export class CategoryResponseDtoBuilder extends BaseResponseDtoBuilder<CategoryResponseDto> {
    constructor() {
        super(CategoryResponseDto);
    }
}
