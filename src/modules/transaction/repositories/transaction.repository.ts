import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BoostedJobsEntity } from '@database/entities';
import { TransactionEntity } from '@src/database/entities/transaction.entity';

@Injectable()
export class TransactionRepository extends Repository<TransactionEntity> {
    constructor(
        @InjectRepository(TransactionEntity)
        private readonly repository: Repository<TransactionEntity>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
