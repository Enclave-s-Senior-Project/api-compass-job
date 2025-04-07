import { JobService } from '@modules/job/service/job.service';
import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import { BoostJobJobResponseDtoBuilder, CreateBoostJobDto } from './dto';
import { EnterpriseService } from '@modules/enterprise/service/enterprise.service';
import { BoostJobRepository } from './repositories/boost-job.repository';
import { PREMIUM_TYPE } from '@database/entities/enterprise.entity';
import { CacheService } from '@src/cache/cache.service';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import { BoostJobErrorType } from '@src/common/errors/boost-job-error-type';
import { JobStatusEnum } from '@src/common/enums/job.enum';
@Injectable()
export class BoostJobService {
    constructor(
        @Inject(forwardRef(() => JobService)) private readonly jobService: JobService,
        private readonly enterpriseService: EnterpriseService,
        private readonly boostedJobRepo: BoostJobRepository,
        private readonly cacheService: CacheService
    ) {}

    async create(data: CreateBoostJobDto, enterpriseId: string) {
        try {
            const job = await this.jobService.getJobById(data.jobId);
            if (!job) {
                throw new BadRequestException(BoostJobErrorType.BOOST_JOB_NOT_FOUND);
            }

            const enterprise = await this.enterpriseService.findOneById(enterpriseId);

            if (!enterprise) {
                throw new BadRequestException(BoostJobErrorType.ENTERPRISE_NOT_FOUND);
            }
            if (job.enterprise.enterpriseId !== enterpriseId) {
                throw new BadRequestException(BoostJobErrorType.THIS_JOB_NOT_BELONG_TO_ENTERPRISE);
            }
            if (job.status !== JobStatusEnum.OPEN) {
                throw new BadRequestException(BoostJobErrorType.JOB_NOT_OPEN);
            }
            const boostJobExists = await this.boostedJobRepo.findOne({
                where: {
                    job: { jobId: data.jobId },
                    enterprise: { enterpriseId },
                },
            });
            if (boostJobExists) {
                throw new BadRequestException(BoostJobErrorType.BOOST_JOB_ALREADY_EXISTS);
            }
            if (data.pointsUsed > enterprise.totalPoints) {
                throw new BadRequestException(BoostJobErrorType.BOOST_JOB_LIMIT_EXCEEDED);
            }

            const boostedJob = await this.boostedJobRepo.create({
                ...data,
                job,
                enterprise,
            });
            await this.boostedJobRepo.save(boostedJob);
            this.enterpriseService.updateBoostLimit(enterpriseId, -data.pointsUsed);
            return new BoostJobJobResponseDtoBuilder().setValue(boostedJob).build();
        } catch (error) {
            console.error('Error creating boosted job:', error);
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getAllBoostedJobsWithTotalPoints(excludeJobId?: string) {
        const query = this.boostedJobRepo
            .createQueryBuilder('b')
            .select('b.job', 'jobId')
            .addSelect('SUM(b.pointsUsed)', 'total')
            .groupBy('b.job');

        if (excludeJobId) {
            query.where('b.job != :jobId', { jobId: excludeJobId });
        }

        const result = await query.getRawMany();

        return result.map((r) => ({
            jobId: r.jobId,
            total: parseInt(r.total),
        }));
    }

    async getTotalPointsByJobId(jobId: string): Promise<number> {
        const result = await this.boostedJobRepo
            .createQueryBuilder('b')
            .select('COALESCE(SUM(b.pointsUsed), 0)', 'total')
            .where('b.job = :jobId', { jobId })
            .getRawOne();

        return parseInt(result.total);
    }
}
