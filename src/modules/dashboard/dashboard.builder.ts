import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class DashboardResponseDto extends BaseResponseDto {}

export class DashboardResponseDtoBuilder extends BaseResponseDtoBuilder<DashboardResponseDto> {
    constructor() {
        super(DashboardResponseDto);
    }
}
