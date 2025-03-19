import { JobService } from '@modules/job/service/job.service';
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateBoostJobDto } from './dto';
import { EnterpriseService } from '@modules/enterprise/service/enterprise.service';
import { BoostJobRepository } from './repositories/boost-job.repository';
import { PREMIUM_TYPE } from '@database/entities/enterprise.entity';
@Injectable()
export class BoostJobService {
    constructor(
        private readonly jobService: JobService,
        private readonly enterpriseService: EnterpriseService,
        private readonly boostedJobRepo: BoostJobRepository
    ) {}

    async boostJob(boostJob: CreateBoostJobDto, enterpriseId: string) {
        // Fetch job details
        const job = await this.jobService.getJobById(boostJob.jobId);
        if (!job) throw new BadRequestException('JOB_NOT_FOUND');

        // Fetch enterprise details
        const enterprise = await this.enterpriseService.findOne(enterpriseId);
        if (!enterprise.isPremium) throw new BadRequestException('PREMIUM_REQUIRED');

        // Check current boost limit
        const activeBoosts = await this.boostedJobRepo.count({
            where: { job: { enterprise: { enterpriseId } } },
        });

        if (activeBoosts >= enterprise.boostLimit) {
            throw new BadRequestException('BOOST_LIMIT_REACHED');
        }

        // Determine boost duration based on premium type
        const durationDays = this.getBoostDuration(enterprise.premiumType);

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);

        // Create new boosted job
        const boostedJob = this.boostedJobRepo.create({ job, boostedAt: new Date(), expiresAt });

        // Save boosted job
        await this.boostedJobRepo.save(boostedJob);

        return boostedJob;
    }

    private getBoostDuration(premiumType: PREMIUM_TYPE): number {
        switch (premiumType) {
            case PREMIUM_TYPE.BASIC:
                return 7; // Boost lasts for 7 days
            case PREMIUM_TYPE.STANDARD:
                return 14; // Boost lasts for 14 days
            case PREMIUM_TYPE.PREMIUM:
                return 30; // Boost lasts for 30 days
            default:
                return 0;
        }
    }
}
