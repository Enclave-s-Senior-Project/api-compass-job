import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AppliedJobEntity } from '@database/entities';

@Injectable()
export class ApplyJobRepository extends Repository<AppliedJobEntity> {
    constructor(
        @InjectRepository(AppliedJobEntity)
        private readonly repository: Repository<AppliedJobEntity>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
