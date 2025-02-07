import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class RefreshTokenResponseDto extends BaseResponseDto {}

export class RefreshTokenResponseDtoBuilder extends BaseResponseDtoBuilder<RefreshTokenResponseDto> {
    constructor() {
        super(RefreshTokenResponseDto);
    }
}
