import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FCMTokenEntity } from '@database/entities';

@Injectable()
export class FCMTokenRepository extends Repository<FCMTokenEntity> {
    constructor(
        @InjectRepository(FCMTokenEntity)
        private readonly repository: Repository<FCMTokenEntity>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
