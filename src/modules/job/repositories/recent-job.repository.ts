import { JobRecentlyEntity } from '@database/entities';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class RecentJobRepository extends Repository<JobRecentlyEntity> {
    constructor(
        @InjectRepository(JobRecentlyEntity)
        private readonly repository: Repository<JobRecentlyEntity>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
