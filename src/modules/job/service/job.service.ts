import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JwtPayload, PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { JobRepository } from '../repositories';
import Redis, { RedisCommander } from 'ioredis';
import { BoostedJobsEntity, JobEntity } from '@database/entities';
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
import { Brackets, LessThan, Not } from 'typeorm';
import { CacheService } from '@src/cache/cache.service';
import * as _ from 'lodash';
import { JobStatusEnum, JobTypeEnum } from '@src/common/enums/job.enum';
import { FindJobsByEnterpriseDto, SortByEnum } from '@src/modules/enterprise/dtos/find-job-by-enterprise.dto';
import { BoostJobService } from '@src/modules/boost-job/boost-job.service';
@Injectable()
export class JobService {
    constructor(
        private readonly jobRepository: JobRepository,
        private readonly addressService: AddressService,
        private readonly categoryService: CategoryService,
        private readonly enterpriseService: EnterpriseService,
        private readonly tagService: TagService,
        private readonly cacheService: CacheService,
        private readonly boostJobService: BoostJobService,
        @Inject(redisProviderName) private readonly redisCache: Redis
    ) {}

    async create(createJobDto: Omit<CreateJobDto, 'enterpriseId'>, accountId: string, enterpriseId: string) {
        try {
            const { address, categoryIds, specializationIds, tagIds, ...jobData } = createJobDto;

            const addressIds = Array.isArray(address) ? address : [];
            console.log('addressIds', addressIds);
            if (addressIds.length === 0) {
                console.log('address');
            }
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
            this.cacheService.deleteCache();
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
                throw new NotFoundException(JobErrorType.JOB_NOT_FOUND);
            }

            const isExistedWishList = await this.jobRepository.exists({
                where: {
                    jobId: payload.jobId,
                    profiles: { profileId: user.profileId },
                },
                relations: ['profiles'],
            });

            if (isExistedWishList) {
                throw new BadRequestException(JobErrorType.JOB_ADDED_WISHLIST);
            }

            await this.jobRepository
                .createQueryBuilder()
                .insert()
                .into('jobs_favorite')
                .values([{ job_id: payload.jobId, profile_id: user.profileId }])
                .execute();

            return new JobResponseDtoBuilder().setValue(null).success().build();
        } catch (error) {
            console.error(error);
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async deleteJobWishList(id: string, user: JwtPayload) {
        try {
            await this.jobRepository
                .createQueryBuilder()
                .delete()
                .from('jobs_favorite')
                .where('job_id = :jobId and profile_id = :profileId', { jobId: id, profileId: user.profileId })
                .execute();
            return new JobResponseDtoBuilder().setValue(null).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
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
            const job = await this.jobRepository.findOne({
                where: { jobId: id },
                relations: ['enterprise'],
                select: {
                    enterprise: {
                        enterpriseId: true,
                    },
                    jobId: true,
                    status: true,
                },
            });
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
                relations: ['tags', 'enterprise', 'addresses', 'profiles', 'categories', 'specializations'],
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

    async getJobOfEnterprise(enterpriseId: string, pagination: FindJobsByEnterpriseDto): Promise<JobResponseDto> {
        try {
            // Validate input
            if (!ValidationHelper.isValidateUUIDv4(enterpriseId)) {
                throw new BadRequestException(GlobalErrorType.INVALID_ID);
            }

            const cacheKey = `${enterpriseId}:${JSON.stringify(pagination)}`;
            const cachedResult = await this.cacheService.getCacheEnterpriseJobFilter(cacheKey);
            if (cachedResult) {
                return new JobResponseDtoBuilder().setValue(cachedResult).build();
            }

            // Build base query with all needed relations
            const queryBuilder = this.jobRepository
                .createQueryBuilder('jobs')
                .leftJoinAndSelect('jobs.addresses', 'addresses')
                .leftJoinAndSelect('jobs.appliedJob', 'appliedJob')
                .leftJoinAndSelect('jobs.enterprise', 'enterprise')
                .leftJoinAndSelect('jobs.tags', 'tags')
                .leftJoinAndSelect('jobs.categories', 'categories')
                .leftJoinAndSelect('jobs.boostedJob', 'boosted_jobs')
                .where('enterprise.enterpriseId = :enterpriseId', { enterpriseId });

            // Search filter - search in job name and tags (fixed join issue)
            if (pagination.search?.trim()) {
                const search = pagination.search.trim();
                const searchPattern = `${search}%`;

                queryBuilder
                    .leftJoin('jobs.tags', 'tag') // join the tags relation
                    .andWhere(
                        new Brackets((qb) => {
                            qb.where("to_tsvector('english', jobs.name) @@ plainto_tsquery(:search)", { search })
                                .orWhere('jobs.name ILIKE :searchPattern', { searchPattern })
                                .orWhere('tag.name ILIKE :searchPattern', { searchPattern });
                        })
                    );
            }

            // Apply all filters
            if (pagination.jobType) {
                queryBuilder.andWhere('jobs.type = :jobType', { jobType: pagination.jobType });
            }

            if (pagination.jobStatus) {
                queryBuilder.andWhere('jobs.status = :jobStatus', { jobStatus: pagination.jobStatus });
            }

            if (pagination.jobLocation) {
                queryBuilder.andWhere('addresses.addressId = :jobLocation', { jobLocation: pagination.jobLocation });
            }

            if (pagination.jobExperience) {
                const [min, max] = pagination.jobExperience.split('-').map(Number);
                queryBuilder.andWhere('jobs.experience BETWEEN :min AND :max', { min, max });
            }

            if (pagination.jobBoost !== undefined) {
                queryBuilder.andWhere(pagination.jobBoost ? 'boostedJob.id IS NOT NULL' : 'boostedJob.id IS NULL');
            }

            // Select only needed fields
            queryBuilder.select([
                'jobs.jobId',
                'jobs.name',
                'jobs.type',
                'jobs.status',
                'jobs.introImg',
                'jobs.createdAt',
                'jobs.updatedAt',
                'jobs.deadline',
                'jobs.highestWage',
                'jobs.lowestWage',
                'jobs.experience',
                'jobs.isBoost',
                'addresses',
                'appliedJob',
                'enterprise.enterpriseId',
                'enterprise.name',
                'enterprise.logoUrl',
                'tags',
                'categories',
                'boosted_jobs.id',
                'boosted_jobs.boostedAt',
                'boosted_jobs.pointsUsed',
            ]);

            // Apply sorting with consistent parameters
            switch (pagination.sort) {
                case SortByEnum.ASC:
                    queryBuilder.orderBy('jobs.name', 'ASC');
                    break;
                case SortByEnum.DESC:
                    queryBuilder.orderBy('jobs.name', 'DESC');
                    break;
                case SortByEnum.LATEST:
                    queryBuilder.orderBy('jobs.updatedAt', 'ASC');
                    break;
                case SortByEnum.NEWEST:
                    queryBuilder.orderBy('jobs.updatedAt', 'DESC');
                    break;
                case SortByEnum.DEADLINE:
                    queryBuilder.orderBy('jobs.deadline', 'ASC');
                    break;
                default:
                    queryBuilder.orderBy('jobs.updatedAt', 'DESC');
                    break;
            }

            // Apply pagination
            queryBuilder.skip(pagination.skip).take(Number(pagination.take));

            // Execute query
            const [jobs, total] = await queryBuilder.getManyAndCount();

            // Format results
            const formattedResult = jobs.map((job) => ({
                ...job,
                applicationCount: job.appliedJob?.length || 0,
            }));

            // Create metadata
            const meta = new PageMetaDto({
                pageOptionsDto: pagination,
                itemCount: total,
            });

            const result = new PageDto(formattedResult, meta);

            this.cacheService.cacheEnterpriseJobFilterData(cacheKey, result);

            return new JobResponseDtoBuilder().setValue(result).success().build();
        } catch (error) {
            console.error('Error fetching jobs of enterprise:', error);
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
            const resultCache = await this.cacheService.getCacheJobFilter(urlQuery);

            if (resultCache) {
                return new JobResponseDtoBuilder().setValue(resultCache).build();
            }

            const queryBuilder = this.jobRepository
                .createQueryBuilder('jobs')
                .leftJoinAndSelect('jobs.addresses', 'addresses')
                .leftJoinAndSelect('jobs.categories', 'industries')
                .leftJoinAndSelect('jobs.specializations', 'majorities')
                .leftJoinAndSelect('jobs.enterprise', 'enterprise')
                .leftJoinAndSelect('jobs.tags', 'tags')
                .leftJoinAndSelect('jobs.boostedJob', 'boosted_jobs');

            // Full-Text Search
            if (query.name) {
                queryBuilder.andWhere(
                    "to_tsvector('english', jobs.name) @@ plainto_tsquery(:name) OR jobs.name ILIKE :namePattern",
                    {
                        name: query.name.trim(),
                        namePattern: `%${query.name.trim()}%`,
                    }
                );
            }

            // Location Filters
            if (query.country) {
                queryBuilder.andWhere('unaccent(addresses.country) ILIKE unaccent(:country)', {
                    country: `%${query.country}%`,
                });
            }
            if (query.city) {
                queryBuilder.andWhere('unaccent(addresses.city) ILIKE unaccent(:city)', { city: `%${query.city}%` });
            }

            // Category Filters
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

            // Wage Filters
            if (query.minWage !== undefined) {
                queryBuilder.andWhere('jobs.lowestWage >= :minWage', {
                    minWage: Number(query.minWage),
                });
            }
            if (query.maxWage !== undefined) {
                queryBuilder.andWhere('jobs.highestWage <= :maxWage', {
                    maxWage: Number(query.maxWage),
                });
            }

            // Job Attributes
            if (query.experience !== undefined) {
                queryBuilder.andWhere('jobs.experience = :experience', {
                    experience: Number(query.experience),
                });
            }
            if (query.type) {
                queryBuilder.andWhere('jobs.type = ANY(:type)', { type: query.type });
            }
            if (query.education) {
                queryBuilder.andWhere('jobs.education = ANY(:education)', {
                    education: query.education,
                });
            }

            // Enterprise Filter
            if (query.enterpriseId) {
                queryBuilder.andWhere('enterprise.enterpriseId = :enterpriseId', {
                    enterpriseId: query.enterpriseId,
                });
            }

            // Tag Filter
            if (query.tagId) {
                queryBuilder.andWhere('tags.tagId = :tagId', { tagId: query.tagId });
            }

            // Status and Deadline
            queryBuilder.andWhere('jobs.status = :status', { status: JobStatusEnum.OPEN });
            queryBuilder.andWhere('jobs.deadline > CURRENT_DATE');

            // Select fields
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
                'addresses.addressId',
                'addresses.country',
                'addresses.city',
                'addresses.street',
                'addresses.zipCode',
                'industries.categoryId',
                'industries.categoryName',
                'majorities.categoryId',
                'majorities.categoryName',
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
                'tags.tagId',
                'tags.name',
                'tags.color',
                'tags.backgroundColor',
                'boosted_jobs.id',
                'boosted_jobs.boostedAt',
                'boosted_jobs.pointsUsed',
            ]);

            queryBuilder
                .orderBy('boosted_jobs.pointsUsed', 'DESC', 'NULLS LAST')
                .addOrderBy('boosted_jobs.boostedAt', 'ASC', 'NULLS LAST')
                .addOrderBy('jobs.deadline', 'ASC')
                .addOrderBy('jobs.updatedAt', 'DESC')
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
            this.cacheService.cacheJobFilterData(urlQuery, new PageDto(jobs, meta));
            return new JobResponseDtoBuilder().setValue(new PageDto(jobs, meta)).build();
        } catch (error) {
            console.error('Filter Query Error:', error);
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    protected async storeFilterResultOnCache(key: string, results: any) {
        const cacheKey = `jobfilter:${key}`;
        await this.redisCache.set(cacheKey, JSON.stringify(results), 'EX', 60 * 60 * 24); // Cache for 1 day
    }

    protected async getFilterResultOnCache(key: string) {
        const cacheResult = await this.redisCache.get(`jobfilter:${key}`);
        return JSON.parse(cacheResult) || null;
    }

    public async updateJob(jobId: string, updatePayload: UpdateJobDto, user: JwtPayload): Promise<JobResponseDto> {
        try {
            // Validate UUID
            if (!ValidationHelper.isValidateUUIDv4(jobId)) {
                throw new BadRequestException(GlobalErrorType.INVALID_ID);
            }

            // Check if job has applications
            const hasApplications = await this.checkJobHasApplication(jobId);
            if (hasApplications) {
                throw new BadRequestException(JobErrorType.JOB_HAS_APPLICATION);
            }

            // Check job exists and belongs to the enterprise
            const existingJob = await this.jobRepository.findOne({
                where: {
                    jobId,
                    enterprise: { enterpriseId: user.enterpriseId },
                },
                relations: ['enterprise'],
            });

            if (!existingJob) {
                throw new NotFoundException(GlobalErrorType.JOB_NOT_FOUND);
            }

            // Validate category and specialization
            if (updatePayload.categoryIds?.length !== 1) {
                throw new BadRequestException(JobErrorType.JOB_CATEGORY_JUST_ONE);
            }

            if (updatePayload.specializationIds?.length > 0) {
                const isFamilyCategory = await Promise.all(
                    updatePayload.specializationIds.map((specializationId) =>
                        this.categoryService.checkFamilyCategory(updatePayload.categoryIds[0], specializationId)
                    )
                ).then((results) => results.every(Boolean));

                if (!isFamilyCategory) {
                    throw new BadRequestException(GlobalErrorType.MAJORITY_MUST_BE_CHILD_OF_INDUSTRY);
                }
            }

            // Prepare relation data
            const { address, categoryIds, specializationIds, tagIds, ...jobData } = updatePayload;

            const addressIds = Array.isArray(address) ? address : [];
            const categoryIdsArray = Array.isArray(categoryIds) ? categoryIds : [];
            const specializationIdsArray = Array.isArray(specializationIds) ? specializationIds : [];
            const tagIdsArray = Array.isArray(tagIds) ? tagIds : [];

            const [addresses, categories, tags, specializations] = await Promise.all([
                addressIds.length > 0 ? this.addressService.getAddressByIds(addressIds) : [],
                categoryIdsArray.length > 0 ? this.categoryService.findByIds(categoryIdsArray) : [],
                tagIdsArray.length > 0 ? this.tagService.findByIds(tagIdsArray) : [],
                specializationIdsArray.length > 0 ? this.categoryService.findByIds(specializationIdsArray) : [],
            ]);

            // Delete existing relations
            await this.removeJobRelates(jobId);

            // Update job
            await this.jobRepository.save({
                ...existingJob,
                ...jobData,
                addresses,
                categories,
                tags,
                specializations,
            });

            // Clear cache
            this.cacheService.removeSearchJobsCache();
            this.cacheService.removeEnterpriseSearchJobsCache();

            return new JobResponseDtoBuilder().setValue(null).success().build();
        } catch (error) {
            console.error('Error updating job:', error);
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
            this.cacheService.removeSearchJobsCache();
            this.cacheService.removeEnterpriseSearchJobsCache();
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

    public async closeJob(jobId: string, user: JwtPayload) {
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

            await this.jobRepository.update({ jobId }, { status: JobStatusEnum.CLOSED, deadline: new Date() });
            // clear filter search cache
            this.cacheService.removeSearchJobsCache();
            this.cacheService.removeEnterpriseSearchJobsCache();

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

    public batchUnexpiredJob(batchSize: number = 100, offset: number = 0): Promise<JobEntity[]> {
        try {
            const jobs = this.jobRepository.find({
                where: {
                    status: Not(JobStatusEnum.EXPIRED), // Only fetch jobs that are not already expired
                    deadline: LessThan(new Date()), // Fetch jobs where the deadline has passed
                },
                select: {
                    jobId: true,
                    name: true,
                    status: true,
                    deadline: true,
                    enterprise: {
                        enterpriseId: true,
                        email: true,
                        name: true,
                    },
                },
                relations: {
                    enterprise: true,
                },
                skip: offset,
                take: batchSize,
            });
            return jobs;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async updateBulkJobExpired(jobs: JobEntity[]) {
        try {
            const result = await this.jobRepository
                .createQueryBuilder()
                .update('jobs')
                .set({ status: JobStatusEnum.EXPIRED })
                .where('job_id IN (:...jobIds)', { jobIds: jobs.map((job) => job.jobId) })
                .execute();
            return result;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async estimateRankIfBoost(jobId: string, plusPoints: number) {
        try {
            const job = await this.jobRepository.findOne({
                where: { jobId },
            });

            if (!job) throw new NotFoundException(JobErrorType.JOB_NOT_FOUND);

            const currentTotal = await this.boostJobService.getTotalPointsByJobId(jobId);
            const projectedTotal = currentTotal + plusPoints;

            const others = await this.boostJobService.getAllBoostedJobsWithTotalPoints(jobId);

            const allJobs = [...others, { jobId, total: projectedTotal }];

            allJobs.sort((a, b) => b.total - a.total);

            const rank = allJobs.findIndex((j) => j.jobId === jobId) + 1;

            return {
                estimatedRank: rank,
                projectedBoost: projectedTotal,
                plusPoints,
                totalJobs: allJobs.length,
            };
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async getJobByIdEnterprise(id: string, take: number) {
        try {
            const jobs = await this.jobRepository.find({
                where: { enterprise: { enterpriseId: id } },
                take: take,
                order: { createdAt: 'DESC' },
            });
            return jobs;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
