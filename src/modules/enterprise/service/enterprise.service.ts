import { Injectable } from '@nestjs/common';
import { ProfileRepository } from '../repositories';

@Injectable()
export class UserService {
    constructor(private readonly profileRepository: ProfileRepository){}

}
