import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class LoginResponseDto extends BaseResponseDto {}

export class LoginResponseDtoBuilder extends BaseResponseDtoBuilder<LoginResponseDto> {
    constructor() {
        super(LoginResponseDto);
    }
}
