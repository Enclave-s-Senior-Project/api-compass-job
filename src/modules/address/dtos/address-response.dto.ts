import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class AddressResponseDto extends BaseResponseDto {}

export class AddressResponseDtoBuilder extends BaseResponseDtoBuilder<AddressResponseDto> {
    constructor() {
        super(AddressResponseDto);
    }
}
