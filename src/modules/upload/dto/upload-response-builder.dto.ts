import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class UploadResponseDto extends BaseResponseDto {}

export class UploadResponseDtoBuilder extends BaseResponseDtoBuilder<UploadResponseDto> {
    constructor() {
        super(UploadResponseDto);
    }
}
