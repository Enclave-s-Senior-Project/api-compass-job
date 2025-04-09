import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class TransactionResponseDto extends BaseResponseDto {}

export class TransactionResponseDtoBuilder extends BaseResponseDtoBuilder<TransactionResponseDto> {
    constructor() {
        super(TransactionResponseDto);
    }
}
