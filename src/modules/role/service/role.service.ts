import { Injectable } from '@nestjs/common';
import { RoleRepository } from '../repositories/role.repository';

@Injectable()
export class RoleService {
    constructor(private readonly RoleRepository: RoleRepository) {}

    public async getRoleByName(name: string) {
        return this.RoleRepository.findOne({ where: { role: name } });
    }
    async createRole(name: string) {
        try {
            return this.RoleRepository.save({ role: name });
        } catch (error) {
            return error;
        }
    }
}
