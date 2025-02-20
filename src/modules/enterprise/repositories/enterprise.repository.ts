import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EnterpriseEntity } from '@database/entities';

@Injectable()
export class EnterpriseRepository extends Repository<EnterpriseEntity> {
    constructor(
        @InjectRepository(EnterpriseEntity)
        private readonly repository: Repository<EnterpriseEntity>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
