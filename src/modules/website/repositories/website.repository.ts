import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { WebsiteEntity } from '@database/entities';

@Injectable()
export class WebsiteRepository extends Repository<WebsiteEntity> {
    constructor(
        @InjectRepository(WebsiteEntity)
        private readonly repository: Repository<WebsiteEntity>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
