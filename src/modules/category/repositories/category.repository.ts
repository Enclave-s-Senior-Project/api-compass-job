import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryEntity } from '@database/entities';

@Injectable()
export class CategoryRepository extends Repository<CategoryEntity> {
    constructor(
        @InjectRepository(CategoryEntity)
        private readonly repository: Repository<CategoryEntity>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
