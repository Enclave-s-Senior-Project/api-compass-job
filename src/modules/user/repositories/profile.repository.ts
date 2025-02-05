import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileEntity } from '@database/entities';

@Injectable()
export class ProfileRepository extends Repository<ProfileEntity> {
    constructor(
        @InjectRepository(ProfileEntity)
        private readonly repository: Repository<ProfileEntity>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
