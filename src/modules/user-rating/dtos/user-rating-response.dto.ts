import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class UserRatingResponseDto extends BaseResponseDto {}

export class UserRatingResponseDtoBuilder extends BaseResponseDtoBuilder<UserRatingResponseDto> {
    constructor() {
        super(UserRatingResponseDto);
    }
}
