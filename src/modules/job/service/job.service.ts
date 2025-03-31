import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JwtPayload, PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { JobRepository } from '../repositories';
import Redis, { RedisCommander } from 'ioredis';
import { JobEntity } from '@database/entities';
import { JobErrorType } from '@common/errors/';
import { ErrorType } from '@common/enums';
import {
    CreateJobWishListDto,
    CreateJobDto,
    JobResponseDto,
    JobResponseDtoBuilder,
    JobFilterDto,
    UpdateJobDto,
} from '../dtos';
import { AddressService } from '@modules/address/service/address.service';
import { CategoryService } from '@modules/category/services';
import { TagService } from '@modules/tag/services';
import { EnterpriseService } from '@modules/enterprise/service/enterprise.service';
import { redisProviderName } from '@cache/cache.provider';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import { ValidationHelper } from '@src/helpers/validation.helper';
import { GlobalErrorType } from '@src/common/errors/global-error';
import { IsNull } from 'typeorm';
import { CacheService } from '@src/cache/cache.service';

@Injectable()
export class JobService {
    constructor(
        private readonly jobRepository: JobRepository,
        private readonly addressService: AddressService,
        private readonly categoryService: CategoryService,
        private readonly enterpriseService: EnterpriseService,
        private readonly tagService: TagService,
        private readonly cacheService: CacheService,
        @Inject(redisProviderName) private readonly redisCache: Redis
    ) {}

    async create(createJobDto: Omit<CreateJobDto, 'enterpriseId'>, accountId: string, enterpriseId: string) {
        try {
            this.clearFilterJobResultOnCache();

            const { address, categoryIds, specializationIds, tagIds, ...jobData } = createJobDto;

            const addressIds = Array.isArray(address) ? address : [];
            const categoryIdsArray = Array.isArray(categoryIds) ? categoryIds : [];
            const specializationIdsArray = Array.isArray(specializationIds) ? specializationIds : [];
            const tagIdsArray = Array.isArray(tagIds) ? tagIds : [];

            const [enterpriseResult, addresses, categories, tags, specializations] = await Promise.all([
                this.enterpriseService.getEnterpriseByAccountId(accountId),
                addressIds.length > 0 ? this.addressService.getAddressByIds(addressIds) : [],
                categoryIdsArray.length > 0 ? this.categoryService.findByIds(categoryIdsArray) : [],
                tagIdsArray.length > 0 ? this.tagService.findByIds(tagIdsArray) : [],
                specializationIdsArray.length > 0 ? this.categoryService.findByIds(specializationIdsArray) : [],
            ]);

            if (!enterpriseResult?.value) {
                return new JobResponseDtoBuilder().setCode(400).setMessageCode(JobErrorType.INVALID_ENTERPRISE).build();
            }

            const enterprise = enterpriseResult.value;
            const introImg = enterprise.logoUrl;

            const newJob = this.jobRepository.create({
                ...jobData,
                enterprise,
                addresses,
                categories,
                tags,
                specializations,
                introImg,
            });

            await this.jobRepository.save(newJob);
            this.cacheService.deleteCache();
            return new JobResponseDtoBuilder().setValue(newJob).success().build();
        } catch (error) {
            console.error('Error creating job:', error);
            throw new JobResponseDtoBuilder().setCode(400).setMessageCode(JobErrorType.FETCH_JOB_FAILED).build();
        }
    }

    async getAllJobs(temps: PaginationDto): Promise<JobResponseDto> {
        try {
            if (temps.options) {
                const [profiles, total] = await this.jobRepository.findAndCount({
                    skip: (Number(temps.page) - 1) * Number(temps.take),
                    take: Number(temps.take),
                    relations: ['enterprise', 'addresses', 'tags'],
                    order: {
                        createdAt: temps.options,
                    },
                });

                const meta = new PageMetaDto({
                    pageOptionsDto: temps,
                    itemCount: total,
                });

                return new JobResponseDtoBuilder().setValue(new PageDto<JobEntity>(profiles, meta)).success().build();
            }
            const [profiles, total] = await this.jobRepository.findAndCount({
                skip: (Number(temps.page) - 1) * Number(temps.take),
                take: Number(temps.take),
                relations: ['enterprise', 'addresses'],
            });

            const meta = new PageMetaDto({
                pageOptionsDto: temps,
                itemCount: total,
            });

            return new JobResponseDtoBuilder().setValue(new PageDto<JobEntity>(profiles, meta)).success().build();
        } catch (error) {
            console.error('Error fetching profiles of list jobs:', error);
            return new JobResponseDtoBuilder().setCode(400).setMessageCode(JobErrorType.FETCH_JOB_FAILED).build();
        }
    }

    async getFilterJobs(options: JobFilterDto, pagination: PaginationDto): Promise<JobResponseDto> {
        try {
            const [profiles, total] = await this.jobRepository.findAndCount({
                skip: (Number(pagination.page) - 1) * Number(pagination.take),
                take: Number(pagination.take),
                relations: ['enterprise', 'addresses'],
                where: {
                    name: options.name,
                },
            });

            const meta = new PageMetaDto({
                pageOptionsDto: pagination,
                itemCount: total,
            });

            return new JobResponseDtoBuilder().setValue(new PageDto<JobEntity>(profiles, meta)).success().build();
        } catch (error) {
            console.error('Error fetching profiles:', error);
            return new JobResponseDtoBuilder().setCode(400).setMessageCode(JobErrorType.FETCH_JOB_FAILED).build();
        }
    }

    async createJobWishList(payload: CreateJobWishListDto, user: JwtPayload) {
        try {
            const isExistedJob = await this.jobRepository.existsBy({ jobId: payload.jobId });
            if (!isExistedJob) {
                return new JobResponseDtoBuilder().badRequestContent(JobErrorType.JOB_NOT_FOUND).build();
            }

            const isExistedWishList =
                (await this.jobRepository
                    .createQueryBuilder()
                    .innerJoin('jobs_favorite', 'jf', 'jf.job_id=:jobId', { jobId: payload.jobId })
                    .getCount()) > 0;
            if (isExistedWishList) {
                return new JobResponseDtoBuilder().badRequestContent(JobErrorType.JOB_ADDED_WISHLIST).build();
            }

            await this.jobRepository
                .createQueryBuilder()
                .insert()
                .into('jobs_favorite')
                .values([{ job_id: payload.jobId, profile_id: user.profileId }])
                .execute();

            return new JobResponseDtoBuilder().success().build();
        } catch (error) {
            console.error('Error create job wish list');
            return new JobResponseDtoBuilder().setCode(500).setMessageCode(ErrorType.InternalErrorServer).build();
        }
    }

    async deleteJobWishList(id: string, user: JwtPayload) {
        try {
            await this.jobRepository
                .createQueryBuilder()
                .delete()
                .from('jobs_favorite')
                .where('job_id = :jobId', { jobId: id })
                .andWhere('profile_id = :profileId', { profileId: user.profileId })
                .execute();
            return new JobResponseDtoBuilder().success().build();
        } catch (error) {
            console.error('Error delete job wish list');
            return new JobResponseDtoBuilder().setCode(500).setMessageCode(ErrorType.InternalErrorServer).build();
        }
    }

    async getJobWishList(query: PaginationDto, user: JwtPayload) {
        try {
            const [result, total] = await this.jobRepository.findAndCount({
                where: { profiles: { profileId: user.profileId } },
                relations: {
                    enterprise: true,
                    addresses: true,
                },
                skip: (Number(query.page) - 1) * Number(query.take),
                take: Number(query.take),
            });

            const meta = new PageMetaDto({
                pageOptionsDto: query,
                itemCount: total,
            });
            return new JobResponseDtoBuilder().setValue(new PageDto<JobEntity>(result, meta)).success().build();
        } catch (error) {
            console.error('Error get jobs wish list: ', error);
            return new JobResponseDtoBuilder().setCode(500).setMessageCode(ErrorType.InternalErrorServer).build();
        }
    }

    async getJobById(id: string): Promise<JobEntity> {
        try {
            const job = await this.jobRepository.findOne({ where: { jobId: id } });
            return job;
        } catch (err) {
            console.log('Error getting job by id: ', err);
            return null;
        }
    }

    async getDetailJobById(id: string, userId: string): Promise<JobResponseDto> {
        try {
            let isFavorite = false;
            const job = await this.jobRepository.findOne({
                where: { jobId: id },
                relations: ['tags', 'enterprise', 'addresses', 'profiles'],
            });

            if (!job) {
                return new JobResponseDtoBuilder().badRequestContent(JobErrorType.JOB_NOT_FOUND).build();
            }

            if (userId) {
                isFavorite = job.profiles?.some((profile) => profile.profileId === userId) ?? false;
            }

            const jobWithFavorite = {
                ...job,
                isFavorite,
            };

            return new JobResponseDtoBuilder().setValue(jobWithFavorite).success().build();
        } catch (error) {
            console.error('Error get detail job by id: ', error);
            return new JobResponseDtoBuilder().setCode(500).setMessageCode(ErrorType.InternalErrorServer).build();
        }
    }

    async getJobOfEnterprise(enterpriseId: string, pagination: PaginationDto) {
        try {
            const [jobs, total] = await this.jobRepository.findAndCount({
                where: {
                    enterprise: {
                        enterpriseId: enterpriseId,
                    },
                },
                relations: {
                    addresses: true,
                    appliedJob: true,
                    enterprise: true,
                },
                select: {
                    jobId: true,
                    name: true,
                    type: true,
                    status: true,
                    introImg: true,
                    createdAt: true,
                    updatedAt: true,
                    deadline: true,
                    highestWage: true,
                    lowestWage: true,
                    userRatings: true,
                    enterprise: {
                        enterpriseId: true,
                        name: true,
                        logoUrl: true,
                    },
                },
                skip: (Number(pagination.page) - 1) * Number(pagination.take),
                take: Number(pagination.take),
                order: {
                    createdAt: 'DESC',
                },
            });

            const formattedResult = jobs.map((job) => ({
                ...job,
                applicationCount: job.appliedJob ? job.appliedJob?.length : 0,
            }));

            const meta = new PageMetaDto({
                pageOptionsDto: pagination,
                itemCount: total,
            });
            const result = new PageDto(formattedResult, meta);
            return new PageDto(formattedResult, meta);
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
    async totalJobsByEnterprise(enterpriseId: string): Promise<number> {
        try {
            return this.jobRepository.count({ where: { enterprise: { enterpriseId } } });
        } catch (error) {
            console.error('Error get total jobs by enterprise: ', error);
            return 0;
        }
    }

    async filter(query: JobFilterDto, urlQuery: string) {
        try {
            const resultCache = await this.getFilterResultOnCache(urlQuery);
            if (resultCache && resultCache.length > 0) {
                const meta = new PageMetaDto({
                    itemCount: resultCache.length,
                    pageOptionsDto: {
                        skip: query.skip,
                        options: query.options,
                        order: query.order,
                        page: query.page,
                        take: query.take,
                    },
                });
                return new JobResponseDtoBuilder().setValue(new PageDto(resultCache, meta)).build();
            }

            const queryBuilder = this.jobRepository.createQueryBuilder('jobs');

            // Conditional joins based on query parameters
            if (query.country || query.city) {
                queryBuilder.leftJoinAndSelect('jobs.addresses', 'addresses');
            }
            if (query.industryCategoryId) {
                queryBuilder.leftJoinAndSelect('jobs.categories', 'industries');
            }
            if (query.majorityCategoryId) {
                queryBuilder.leftJoinAndSelect('jobs.specializations', 'majorities');
            }
            queryBuilder.leftJoinAndSelect('jobs.enterprise', 'enterprise'); // Always needed for company mixing
            if (query.tagId) {
                queryBuilder.leftJoinAndSelect('jobs.tags', 'tags');
            }
            queryBuilder.leftJoinAndSelect('jobs.boostedJob', 'boosted_jobs'); // Always needed for sorting

            // Filters
            if (query.name) {
                queryBuilder.andWhere(
                    "to_tsvector('english', jobs.name) @@ plainto_tsquery(:name) OR jobs.name ILIKE :namePattern",
                    { name: query.name.trim(), namePattern: `%${query.name.trim()}%` }
                );
            }
            if (query.country) {
                queryBuilder.andWhere('unaccent(addresses.country) ILIKE unaccent(:country)', {
                    country: `%${query.country}%`,
                });
            }
            if (query.city) {
                queryBuilder.andWhere('unaccent(addresses.city) ILIKE unaccent(:city)', {
                    city: `%${query.city}%`,
                });
            }
            if (query.industryCategoryId) {
                queryBuilder.andWhere('industries.categoryId = :industryId', {
                    industryId: query.industryCategoryId,
                });
            }
            if (query.majorityCategoryId) {
                queryBuilder.andWhere('majorities.categoryId = :majorityId', {
                    majorityId: query.majorityCategoryId,
                });
            }
            if (query.minWage !== undefined) {
                queryBuilder.andWhere('jobs.lowestWage >= :minWage', { minWage: Number(query.minWage) });
            }
            if (query.maxWage !== undefined) {
                queryBuilder.andWhere('jobs.highestWage <= :maxWage', { maxWage: Number(query.maxWage) });
            }
            if (query.experience !== undefined) {
                queryBuilder.andWhere('jobs.experience = :experience', { experience: Number(query.experience) });
            }
            if (query.type) {
                queryBuilder.andWhere('jobs.type = ANY(:type)', { type: query.type });
            }
            if (query.education) {
                queryBuilder.andWhere('jobs.education = ANY(:education)', { education: query.education });
            }
            if (query.enterpriseId) {
                queryBuilder.andWhere('enterprise.enterpriseId = :enterpriseId', {
                    enterpriseId: query.enterpriseId,
                });
            }
            if (query.tagId) {
                queryBuilder.andWhere('tags.tagId = :tagId', { tagId: query.tagId });
            }

            // Core filters (always applied)
            queryBuilder.andWhere('jobs.status = :status', { status: true }).andWhere('jobs.deadline > CURRENT_DATE');

            // Select only necessary fields (adjust based on your DTO requirements)
            queryBuilder.select([
                'jobs.jobId',
                'jobs.name',
                'jobs.lowestWage',
                'jobs.highestWage',
                'jobs.description',
                'jobs.responsibility',
                'jobs.type',
                'jobs.experience',
                'jobs.deadline',
                'jobs.introImg',
                'jobs.status',
                'jobs.education',
                'jobs.enterpriseBenefits',
                'jobs.updatedAt',
                ...(query.country || query.city
                    ? [
                          'addresses.addressId',
                          'addresses.country',
                          'addresses.city',
                          'addresses.street',
                          'addresses.zipCode',
                      ]
                    : []),
                ...(query.industryCategoryId ? ['industries.categoryId', 'industries.categoryName'] : []),
                ...(query.majorityCategoryId ? ['majorities.categoryId', 'majorities.categoryName'] : []),
                'enterprise.enterpriseId',
                'enterprise.name',
                'enterprise.email',
                'enterprise.phone',
                'enterprise.description',
                'enterprise.logoUrl',
                'enterprise.backgroundImageUrl',
                'enterprise.foundedIn',
                'enterprise.organizationType',
                'enterprise.teamSize',
                'enterprise.status',
                'enterprise.industryType',
                'enterprise.isPremium',
                ...(query.tagId ? ['tags.tagId', 'tags.name', 'tags.color', 'tags.backgroundColor'] : []),
                'boosted_jobs.id',
                'boosted_jobs.boostedAt',
                'boosted_jobs.expiresAt',
            ]);

            // Sorting: Boosted jobs first, then non-boosted by updatedAt with a deterministic tiebreaker
            queryBuilder
                .orderBy('boosted_jobs.boostedAt', 'DESC', 'NULLS LAST') // Boosted jobs first
                .addOrderBy('jobs.updatedAt', 'DESC') // Non-boosted by recency
                .addOrderBy('jobs.jobId', 'ASC') // Deterministic tiebreaker for mixing
                .skip(query.skip)
                .take(query.take);

            const [jobs, total] = await queryBuilder.getManyAndCount();

            const meta = new PageMetaDto({
                itemCount: total,
                pageOptionsDto: {
                    skip: query.skip,
                    options: query.options,
                    order: query.order,
                    page: query.page,
                    take: query.take,
                },
            });
            this.storeFilterResultOnCache(urlQuery, new PageDto(jobs, meta));
            return new JobResponseDtoBuilder().setValue(new PageDto(jobs, meta)).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
    protected async storeFilterResultOnCache(key: string, results: any) {
        const cacheKey = `jobfilter:${key}`;
        await this.redisCache.set(cacheKey, JSON.stringify(results), 'EX', 60 * 60 * 24); // Cache for 1 day
    }

    protected async getFilterResultOnCache(key: string): Promise<JobEntity[] | null> {
        const cacheResult = await this.redisCache.get(`jobfilter:${key}`);
        return JSON.parse(cacheResult) || null;
    }

    public async clearFilterJobResultOnCache() {
        try {
            let cursor = '0';
            const batchSize = 1000;
            const pipeline = this.redisCache.pipeline();

            do {
                const [nextCursor, keys] = await this.redisCache.scan(
                    cursor,
                    'MATCH',
                    'jobfilter:*',
                    'COUNT',
                    batchSize
                );
                cursor = nextCursor;

                if (keys.length > 0) {
                    keys.forEach((key) => pipeline.del(key));
                }

                // Execute deletion in batches
                if (pipeline.length >= batchSize) {
                    await pipeline.exec();
                }
            } while (cursor !== '0');

            // Execute any remaining deletions
            if (pipeline.length > 0) {
                await pipeline.exec();
            }

            return true;
        } catch (error) {
            throw error;
        }
    }

    public async updateJob(jobId: string, updatePayload: UpdateJobDto, user: JwtPayload): Promise<JobResponseDto> {
        try {
            // Validate UUID
            if (!ValidationHelper.isValidateUUIDv4(jobId)) {
                throw new BadRequestException(GlobalErrorType.INVALID_ID);
            }

            // check that job has any applications
            const hasApplications = await this.checkJobHasApplication(jobId);
            if (hasApplications) {
                throw new BadRequestException(JobErrorType.JOB_HAS_APPLICATION);
            }

            // Check if job exists and belongs to the enterprise
            const existingJob = await this.jobRepository.findOne({
                where: {
                    jobId,
                    enterprise: { enterpriseId: user.enterpriseId },
                    status: true,
                },
                relations: ['enterprise'],
            });

            if (!existingJob) {
                throw new NotFoundException(GlobalErrorType.JOB_NOT_FOUND);
            }

            // check specializationIds is valid with categoryId
            if (updatePayload.categoryIds?.length > 1 || updatePayload.categoryIds?.length === 0) {
                throw new BadRequestException(JobErrorType.JOB_CATEGORY_JUST_ONE);
            }

            if (updatePayload.specializationIds?.length > 0) {
                const isFamilyCategory = await Promise.all(
                    updatePayload.specializationIds?.map((specializationId) =>
                        this.categoryService.checkFamilyCategory(updatePayload.categoryIds?.[0], specializationId)
                    )
                ).then((results) => results.every((result) => result));

                if (!isFamilyCategory) {
                    throw new BadRequestException(GlobalErrorType.MAJORITY_MUST_BE_CHILD_OF_INDUSTRY);
                }
            }

            const relationIds = {
                tags: updatePayload.tagIds?.map((tag) => ({ tagId: tag })) || [],
                categories: updatePayload.categoryIds?.map((categoryId) => ({ categoryId })) || [],
                addresses: updatePayload.address?.map((addressId) => ({ addressId })) || [],
                specializations:
                    updatePayload.specializationIds?.map((specializationId) => ({ categoryId: specializationId })) ||
                    [],
            };

            // Delete existing relations
            await this.removeJobRelates(jobId);

            // Update job
            await this.jobRepository.save({
                ...existingJob,
                name: updatePayload.name,
                lowestWage: updatePayload.lowestWage,
                highestWage: updatePayload.highestWage,
                description: updatePayload.description,
                responsibility: updatePayload.responsibility,
                type: updatePayload.type,
                experience: updatePayload.experience,
                deadline: updatePayload.deadline,
                introImg: updatePayload.introImg,
                status: updatePayload.status,
                education: updatePayload.education,
                enterpriseBenefits: updatePayload.enterpriseBenefits,
                ...relationIds,
            });

            // Clear cache filter search
            await this.clearFilterJobResultOnCache();

            return new JobResponseDtoBuilder().setValue(null).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async deleteJob(jobId: string, user: JwtPayload) {
        try {
            // Validate UUID
            if (!ValidationHelper.isValidateUUIDv4(jobId)) {
                throw new BadRequestException(GlobalErrorType.INVALID_ID);
            }

            const existingJob = await this.jobRepository.exists({
                where: { jobId: jobId, enterprise: { enterpriseId: user.enterpriseId } },
            });
            if (!existingJob) {
                throw new NotFoundException(JobErrorType.JOB_NOT_FOUND);
            }

            const hasApplications = await this.checkJobHasApplication(jobId);
            if (hasApplications) {
                throw new BadRequestException(JobErrorType.JOB_HAS_APPLICATION);
            }

            // remove job relations
            await this.removeJobRelates(jobId);

            // delete job
            await this.jobRepository.delete({ jobId: jobId, enterprise: { enterpriseId: user.enterpriseId } });

            // clear filter search cache
            await this.clearFilterJobResultOnCache();
            return new JobResponseDtoBuilder().setValue(null).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async checkJobHasApplication(jobId: string): Promise<boolean> {
        // check that job has any applications
        const hasApplications = await this.jobRepository
            .createQueryBuilder('jobs')
            .innerJoin('jobs.appliedJob', 'appliedJobs')
            .where('jobs.job_id = :jobId', { jobId })
            .getOne();
        return !!hasApplications;
    }

    public async closeJobOrMakeExpired(jobId: string, user: JwtPayload) {
        try {
            // Validate UUID
            if (!ValidationHelper.isValidateUUIDv4(jobId)) {
                throw new BadRequestException(GlobalErrorType.INVALID_ID);
            }

            const existingJob = await this.jobRepository.exists({
                where: { jobId: jobId, enterprise: { enterpriseId: user.enterpriseId } },
            });
            if (!existingJob) {
                throw new NotFoundException(JobErrorType.JOB_NOT_FOUND);
            }

            await this.jobRepository.update({ jobId }, { status: false, deadline: new Date() });
            // clear filter search cache
            await this.clearFilterJobResultOnCache();

            return new JobResponseDtoBuilder().setValue(null).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async removeJobRelates(jobId: string) {
        try {
            await this.jobRepository.manager.transaction(async (transactionalEntityManager) => {
                await Promise.all([
                    transactionalEntityManager
                        .createQueryBuilder()
                        .delete()
                        .from('job_categories')
                        .where('job_id = :jobId', { jobId })
                        .execute(),
                    transactionalEntityManager
                        .createQueryBuilder()
                        .delete()
                        .from('job_tags')
                        .where('job_id = :jobId', { jobId })
                        .execute(),
                    transactionalEntityManager
                        .createQueryBuilder()
                        .delete()
                        .from('job_addresses')
                        .where('job_id = :jobId', { jobId })
                        .execute(),
                    transactionalEntityManager
                        .createQueryBuilder()
                        .delete()
                        .from('job_specializations')
                        .where('job_id = :jobId', { jobId })
                        .execute(),
                ]);
            });
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
