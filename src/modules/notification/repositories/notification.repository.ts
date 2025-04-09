import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationEntity } from '@database/entities';

@Injectable()
export class NotificationRepository extends Repository<NotificationEntity> {
    constructor(
        @InjectRepository(NotificationEntity)
        private readonly repository: Repository<NotificationEntity>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
