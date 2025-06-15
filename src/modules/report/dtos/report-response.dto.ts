import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class ReportResponseDto extends BaseResponseDto {}

export class ReportResponseDtoBuilder extends BaseResponseDtoBuilder<ReportResponseDto> {
    constructor() {
        super(ReportResponseDto);
    }
}
