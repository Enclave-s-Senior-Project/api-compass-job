import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BoostedJobsEntity } from '@database/entities';
import { TransactionEntity } from '@src/database/entities/transaction.entity';
import { HistoryTransactionEntity } from '@src/database/entities/history-transaction.entity';

@Injectable()
export class HistoryTransactionRepository extends Repository<HistoryTransactionEntity> {
    constructor(
        @InjectRepository(HistoryTransactionEntity)
        private readonly repository: Repository<HistoryTransactionEntity>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
