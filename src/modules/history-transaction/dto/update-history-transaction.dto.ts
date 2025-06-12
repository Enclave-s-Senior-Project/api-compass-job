import { PartialType } from '@nestjs/swagger';
import { CreateHistoryTransactionDto } from './create-history-transaction.dto';

export class UpdateHistoryTransactionDto extends PartialType(CreateHistoryTransactionDto) {}
