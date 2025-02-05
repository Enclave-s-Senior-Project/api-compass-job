import { Injectable } from '@nestjs/common';
import { ProfileRepository } from '../repositories';

@Injectable()
export class UserService {
    constructor(private readonly profileRepository: ProfileRepository){}

    /**
     * Create default user
     * @param userDto {}
     * @returns {Promise<>}
     */
    // public async createUser(userDto: any):
}
