import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AddressEntity } from '@database/entities';

@Injectable()
export class AddressRepository extends Repository<AddressEntity> {
    constructor(
        @InjectRepository(AddressEntity)
        private readonly repository: Repository<AddressEntity>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
