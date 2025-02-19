import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TagEntity } from '@database/entities';

@Injectable()
export class TagRepository extends Repository<TagEntity> {
    constructor(
        @InjectRepository(TagEntity)
        private readonly repository: Repository<TagEntity>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
