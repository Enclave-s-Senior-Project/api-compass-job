import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRatingEntity } from '@database/entities';

@Injectable()
export class UserRatingRepository extends Repository<UserRatingEntity> {
    constructor(
        @InjectRepository(UserRatingEntity)
        private readonly repository: Repository<UserRatingEntity>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
