import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AppliedJobEntity, CvEntity } from '@database/entities';

@Injectable()
export class CvRepository extends Repository<CvEntity> {
    constructor(
        @InjectRepository(CvEntity)
        private readonly repository: Repository<CvEntity>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
