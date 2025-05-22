import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import { CreateRecentJobDto } from '../dtos/create-recent-job';
import { RecentJobRepository } from '../repositories';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RecentJobService {
    constructor(private readonly recentJobRepository: RecentJobRepository) {}

    async createRecentJob(payload: CreateRecentJobDto): Promise<boolean> {
        try {
            const exists = await this.recentJobRepository.exists({
                where: {
                    job: {
                        jobId: payload.jobId,
                    },
                    profile: {
                        profileId: payload.profileId,
                    },
                },
                relations: {
                    job: true,
                    profile: true,
                },
            });
            if (exists) {
                return true;
            }
            // Create new recent job
            await this.recentJobRepository.save({
                job: {
                    jobId: payload.jobId,
                },
                profile: {
                    profileId: payload.profileId,
                },
            });
            return true;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
