import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from '@database/entities';

@Injectable()
export class RoleRepository extends Repository<RoleEntity> {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly repository: Repository<RoleEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}