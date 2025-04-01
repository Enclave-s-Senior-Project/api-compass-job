import { JobService } from '@modules/job/service/job.service';
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import { CreateBoostJobDto } from './dto';
import { EnterpriseService } from '@modules/enterprise/service/enterprise.service';
import { BoostJobRepository } from './repositories/boost-job.repository';
import { PREMIUM_TYPE } from '@database/entities/enterprise.entity';
import { CacheService } from '@src/cache/cache.service';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
@Injectable()
export class BoostJobService {
    constructor(
        private readonly jobService: JobService,
        private readonly enterpriseService: EnterpriseService,
        private readonly boostedJobRepo: BoostJobRepository,
        private readonly cacheService: CacheService
    ) {}

    async boostJob(boostJob: CreateBoostJobDto, enterpriseId: string) {
        try {
            const job = await this.jobService.getJobById(boostJob.jobId);
            if (!job) throw new BadRequestException('JOB_NOT_FOUND');

            const existingBoost = await this.boostedJobRepo.findOne({
                where: { job: { jobId: boostJob.jobId } },
                relations: ['job'],
            });
            if (existingBoost) {
                throw new BadRequestException('JOB_ALREADY_BOOSTED');
            }

            const enterprise = await this.enterpriseService.findOne(enterpriseId);
            if (!enterprise.isPremium) throw new BadRequestException('PREMIUM_REQUIRED');

            const activeBoosts = await this.boostedJobRepo.count({
                where: {
                    job: {
                        enterprise: { enterpriseId },
                    },
                    expiresAt: MoreThan(new Date()),
                },
            });

            if (activeBoosts >= enterprise.boostLimit) {
                throw new BadRequestException('BOOST_LIMIT_REACHED');
            }

            const durationDays = this.getBoostDuration(enterprise.premiumType);
            const boostedAt = new Date();
            const expiresAt = new Date(boostedAt);
            expiresAt.setDate(expiresAt.getDate() + durationDays);

            const boostedJob = this.boostedJobRepo.create({
                job,
                boostedAt,
                expiresAt,
            });

            this.boostedJobRepo.save(boostedJob);
            this.cacheService.deleteCache();

            return;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Error in boostJob:', error);
            throw new BadRequestException('JOB_BOOST_FAILED');
        }
    }

    private getBoostDuration(premiumType: PREMIUM_TYPE): number {
        switch (premiumType) {
            case PREMIUM_TYPE.BASIC:
                return 7;
            case PREMIUM_TYPE.STANDARD:
                return 14;
            case PREMIUM_TYPE.PREMIUM:
                return 30;
            default:
                return 0;
        }
    }
}
