import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class RegisterResponseDto extends BaseResponseDto {}

export class RegisterResponseDtoBuilder extends BaseResponseDtoBuilder<RegisterResponseDto> {
    constructor() {
        super(RegisterResponseDto);
    }
}
