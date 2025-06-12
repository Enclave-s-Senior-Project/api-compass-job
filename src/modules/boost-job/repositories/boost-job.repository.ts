import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BoostedJobsEntity } from '@database/entities';

@Injectable()
export class BoostJobRepository extends Repository<BoostedJobsEntity> {
    constructor(
        @InjectRepository(BoostedJobsEntity)
        private readonly repository: Repository<BoostedJobsEntity>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
