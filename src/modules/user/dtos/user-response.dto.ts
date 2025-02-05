import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class UserResponseDto extends BaseResponseDto {}

export class UserResponseDtoBuilder extends BaseResponseDtoBuilder<UserResponseDto> {
    constructor() {
        super(UserResponseDto);
    }
}
