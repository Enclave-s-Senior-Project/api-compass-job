import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class HistoryTransactionResponseDto extends BaseResponseDto {}

export class TransactionResponseDtoBuilder extends BaseResponseDtoBuilder<HistoryTransactionResponseDto> {
    constructor() {
        super(HistoryTransactionResponseDto);
    }
}
