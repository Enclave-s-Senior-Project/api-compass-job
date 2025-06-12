import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class CvResponseDto extends BaseResponseDto {}

export class CvResponseDtoBuilder extends BaseResponseDtoBuilder<CvResponseDto> {
    constructor() {
        super(CvResponseDto);
    }
}
