import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class NotificationResponseDto extends BaseResponseDto {}

export class NotificationResponseDtoBuilder extends BaseResponseDtoBuilder<NotificationResponseDto> {
    constructor() {
        super(NotificationResponseDto);
    }
}
