import { Injectable } from '@nestjs/common';
import { ProfileRepository } from '../repositories';

@Injectable()
export class EnterpriseService {
    constructor(private readonly profileRepository: ProfileRepository) {}
}
