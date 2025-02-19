import { JobEntity } from '@database/entities';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class JobRepository extends Repository<JobEntity> {
    constructor(
        @InjectRepository(JobEntity)
        private readonly repository: Repository<JobEntity>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
