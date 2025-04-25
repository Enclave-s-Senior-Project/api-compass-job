import { JobService } from '@modules/job/service/job.service';
import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { BoostJobJobResponseDtoBuilder, CreateBoostJobDto } from './dto';
import { EnterpriseService } from '@modules/enterprise/service/enterprise.service';
import { BoostJobRepository } from './repositories/boost-job.repository';
import { CacheService } from '@src/cache/cache.service';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import { BoostJobErrorType } from '@src/common/errors/boost-job-error-type';
import { JobStatusEnum } from '@src/common/enums/job.enum';
import { BoostedJobsEntity } from '@src/database/entities';
import { Between } from 'typeorm';
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
            await Promise.all([
                this.jobService.updateBoostJob(data.jobId, data.pointsUsed),
                this.boostedJobRepo.save(boostedJob),
            ]);
            this.cacheService.removeEnterpriseSearchJobsCache();
            this.cacheService.removeSearchJobsCache();
            this.enterpriseService.updateBoostLimit(enterpriseId, -data.pointsUsed);
            return new BoostJobJobResponseDtoBuilder().setValue(boostedJob).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getAllBoostedJobsWithTotalPointsByCategories(
        categoryIds: string[],
        excludeJobId: string
    ): Promise<{ jobId: string; total: number }[]> {
        try {
            const boostedJobs = await this.boostedJobRepo
                .createQueryBuilder('boosted_jobs')
                .innerJoin('boosted_jobs.job', 'job')
                .innerJoin('job.categories', 'category')
                .where('category.categoryId IN (:...categoryIds)', { categoryIds })
                .andWhere('job.jobId != :excludeJobId', { excludeJobId })
                .select(['job.jobId AS jobId', 'SUM(boosted_jobs.pointsUsed) AS total'])
                .groupBy('job.jobId')
                .getRawMany();

            return boostedJobs.map((item) => ({
                jobId: item.jobId,
                total: parseInt(item.total, 10),
            }));
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
    async getTotalPointsByJobId(jobId: string): Promise<number> {
        try {
            const result = await this.boostedJobRepo
                .createQueryBuilder('b')
                .select('COALESCE(SUM(b.pointsUsed), 0)', 'total')
                .where('b.job = :jobId', { jobId })
                .getRawOne();
            return parseInt(result.total);
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async checkBoostJob(jobId: string) {
        try {
            let check = false;
            const boostJob = await this.boostedJobRepo.findOne({
                where: {
                    job: { jobId },
                },
            });
            if (!boostJob) {
                return new BoostJobJobResponseDtoBuilder().setValue(check).build();
            }
            if (boostJob.boostedAt > new Date()) {
                return new BoostJobJobResponseDtoBuilder().setValue(check).build();
            }
            check = true;
            return new BoostJobJobResponseDtoBuilder().setValue(check).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public batchUnexpiredBoostJob(batchSize: number = 100, offset: number = 0): Promise<BoostedJobsEntity[]> {
        try {
            const now = new Date();
            const sixDaysAgo = new Date();
            sixDaysAgo.setDate(now.getDate() - 6);

            const jobs = this.boostedJobRepo.find({
                where: {
                    boostedAt: Between(sixDaysAgo, now),
                },
                skip: offset,
                take: batchSize,
            });
            return jobs;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async deleteBulkBoostedJobs(jobs: BoostedJobsEntity[]) {
        try {
            const result = await this.boostedJobRepo.remove(jobs);
            return result;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
