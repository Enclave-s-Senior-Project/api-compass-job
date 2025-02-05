import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountEntity } from '@database/entities';

@Injectable()
export class AccountRepository extends Repository<AccountEntity> {
    constructor(
        @InjectRepository(AccountEntity)
        private readonly repository: Repository<AccountEntity>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
