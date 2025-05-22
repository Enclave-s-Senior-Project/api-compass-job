import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JwtPayload, PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { JobRepository } from '../repositories';
import Redis, { RedisCommander } from 'ioredis';
import { BoostedJobsEntity, JobEntity } from '@database/entities';
import { JobErrorType } from '@common/errors/';
import { AppliedJobErrorType } from '@common/errors/applied-job-error-type';
import { EnterpriseStatus, ErrorType } from '@common/enums';
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
import { Brackets, LessThan, Not, MoreThan, In } from 'typeorm';
import { CacheService } from '@src/cache/cache.service';
import * as _ from 'lodash';
import { JobStatusEnum, JobTypeEnum } from '@src/common/enums/job.enum';
import { FindJobsByEnterpriseDto, SortByEnum } from '@src/modules/enterprise/dtos/find-job-by-enterprise.dto';
import { BoostJobService } from '@src/modules/boost-job/boost-job.service';
import { Role } from '@src/modules/auth/decorators/roles.decorator';
import { MailSenderService } from '@src/mail/mail.service';
import { WarningException } from '@src/common/http/exceptions/warning.exception';
import { UpdateJobStatusDto } from '../dtos/update-job-status';
import { EmbeddingService } from '@src/modules/embedding/embedding.service';
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
        private readonly mailService: MailSenderService,
        private readonly embeddingService: EmbeddingService,
        @Inject(redisProviderName) private readonly redisCache: Redis
    ) {}

    async create(createJobDto: Omit<CreateJobDto, 'enterpriseId'>, accountId: string, enterpriseId: string) {
        try {
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
            this.cacheService.deleteEnterpriseTotalJob(enterpriseId);
            this.cacheService.removeSearchJobsCache();
            this.cacheService.removeEnterpriseSearchJobsCache();

            await this.jobRepository.save(newJob);

            await this.embeddingService.createJobEmbedding(newJob.jobId);

            return new JobResponseDtoBuilder().setValue(newJob).success().build();
        } catch (error) {
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
                        email: true,
                        name: true,
                    },
                    jobId: true,
                    status: true,
                },
            });
            return job;
        } catch (err) {
            return null;
        }
    }

    async getDetailJobById(id: string, userId: string): Promise<JobResponseDto> {
        try {
            const job = await this.jobRepository.findOne({
                where: { jobId: id },
                relations: [
                    'tags',
                    'enterprise',
                    'addresses',
                    'categories',
                    'specializations',
                    'profiles',
                    'boostedJob',
                ],
                select: {
                    tags: true,
                    enterprise: {
                        enterpriseId: true,
                        name: true,
                        bio: true,
                        addresses: true,
                        logoUrl: true,
                        email: true,
                        phone: true,
                        foundedIn: true,
                        teamSize: true,
                        isPremium: true,
                        websites: true,
                        organizationType: true,
                        categories: true,
                        status: true,
                        isTrial: true,
                    },
                    addresses: true,
                    categories: true,
                    specializations: true,
                    profiles: {
                        profileId: true,
                    },
                    boostedJob: {
                        id: true,
                        pointsUsed: true,
                    },
                },
            });

            if (!job) {
                throw new NotFoundException(GlobalErrorType.JOB_NOT_FOUND);
            }

            let isFavorite = userId ? (job.profiles?.some((profile) => profile.profileId === userId) ?? false) : false;

            const applicationCount = await this.getTotalAppliedJob(job.jobId);

            if (userId) {
                isFavorite = job.profiles?.some((profile) => profile.profileId === userId) ?? false;
            }

            const jobWithExtras = {
                ...job,
                isFavorite,
                enterprise: {
                    ...job.enterprise,
                },
                applicationCount,
            };

            return new JobResponseDtoBuilder().setValue(jobWithExtras).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getJobOfEnterprise(
        enterpriseId: string,
        pagination: FindJobsByEnterpriseDto,
        canGetAllStatusJob: boolean
    ): Promise<JobResponseDto> {
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
                .leftJoinAndSelect('jobs.boostedJob', 'boostedJob')
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

            if (pagination.jobStatus && canGetAllStatusJob) {
                queryBuilder.andWhere('jobs.status = :jobStatus', { jobStatus: pagination.jobStatus });
            } else if (!canGetAllStatusJob) {
                // Default to OPEN status if it's a normal user
                queryBuilder.andWhere('jobs.status = :status', { status: JobStatusEnum.OPEN });
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
                'boostedJob.id',
                'boostedJob.boostedAt',
                'boostedJob.pointsUsed',
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
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async totalJobsByEnterprise(enterpriseId: string): Promise<number> {
        try {
            return this.jobRepository.count({ where: { enterprise: { enterpriseId } } });
        } catch (error) {
            return 0;
        }
    }

    async filter(query: JobFilterDto) {
        try {
            const resultCache = await this.cacheService.getCacheJobFilter(JSON.stringify(query));

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

            // Job status
            if (query.status) {
                queryBuilder.andWhere('jobs.status = :status', { status: query.status });
            }

            // Location Filters
            if (query.location) {
                queryBuilder.andWhere('addresses.mixedAddress ILIKE :addressPattern', {
                    addressPattern: `%${query.location.trim()}%`,
                });
            }

            // Full-Text Search
            if (query.name) {
                queryBuilder.andWhere(
                    new Brackets((qb) => {
                        qb.where("to_tsvector('english', jobs.name) @@ plainto_tsquery(:name)", {
                            name: query.name.trim(),
                        }).orWhere('jobs.name ILIKE :namePattern', {
                            namePattern: `%${query.name.trim()}%`,
                        });
                    })
                );
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
                const [min, max] = query.experience.split('-').map(Number);
                queryBuilder.andWhere('jobs.experience BETWEEN :min AND :max', { min, max });
            }
            if (query.type) {
                queryBuilder.andWhere('jobs.type = ANY(:type)', { type: query.type });
            }
            if (query.education) {
                queryBuilder.andWhere('jobs.education = ANY(:education)', {
                    education: query.education,
                });
            }
            if (query.minDeadline) {
                queryBuilder.andWhere('CAST(jobs.deadline AS date) >= CAST(:minDeadline AS date)', {
                    minDeadline: query.minDeadline,
                });
            }
            if (query.maxDeadline) {
                queryBuilder.andWhere('CAST(jobs.deadline AS date) <= CAST(:maxDeadline AS date)', {
                    maxDeadline: query.maxDeadline,
                });
            }

            // Enterprise Filter
            if (query.enterpriseId) {
                queryBuilder.andWhere('enterprise.enterpriseId = :enterpriseId', {
                    enterpriseId: query.enterpriseId,
                });
            }

            // Deadline filter - only show jobs with future deadlines
            queryBuilder.andWhere('jobs.deadline > CURRENT_DATE');

            // Select fields
            queryBuilder.select([
                'jobs.jobId',
                'jobs.name',
                'jobs.introImg',
                'jobs.type',
                'jobs.experience',
                'jobs.deadline',
                'jobs.status',
                'jobs.updatedAt',
                'jobs.createdAt',
                'jobs.education',
                'jobs.highestWage',
                'jobs.lowestWage',
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
                'enterprise.logoUrl',
                'enterprise.backgroundImageUrl',
                'enterprise.foundedIn',
                'enterprise.organizationType',
                'enterprise.teamSize',
                'enterprise.status',
                'enterprise.isPremium',
                'tags.tagId',
                'tags.name',
                'tags.color',
                'boosted_jobs.id',
                'boosted_jobs.boostedAt',
                'boosted_jobs.pointsUsed',
            ]);

            // Add proper group by to avoid duplicates from joins
            // queryBuilder.groupBy('jobs.jobId')
            //     .addGroupBy('addresses.addressId')
            //     .addGroupBy('industries.categoryId')
            //     .addGroupBy('majorities.categoryId')
            //     .addGroupBy('enterprise.enterpriseId')
            //     .addGroupBy('tags.tagId')
            //     .addGroupBy('boosted_jobs.id');

            // Apply ordering with NULLS handling
            queryBuilder
                .addOrderBy('boosted_jobs.pointsUsed', 'DESC', 'NULLS LAST')
                .addOrderBy('boosted_jobs.boostedAt', 'ASC', 'NULLS LAST')
                .addOrderBy('jobs.deadline', 'ASC')
                .addOrderBy('jobs.updatedAt', 'DESC')
                .skip(query.skip)
                .take(query.take);

            // Execute query with proper logging for debugging
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
            this.cacheService.cacheJobFilterData(JSON.stringify(query), new PageDto(jobs, meta));
            return new JobResponseDtoBuilder().setValue(new PageDto(jobs, meta)).build();
        } catch (error) {
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

            // Update embedding
            await this.embeddingService.createJobEmbedding(jobId);

            // Clear cache
            this.cacheService.removeSearchJobsCache();
            this.cacheService.removeEnterpriseSearchJobsCache();

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

            // delete embedding
            await this.embeddingService.deleteOneJobEmbedding(jobId);

            // clear filter search cache
            this.cacheService.removeSearchJobsCache();
            this.cacheService.removeEnterpriseSearchJobsCache();
            this.cacheService.deleteEnterpriseTotalJob(user.enterpriseId);
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

    public async closeJob(jobId: string, user: JwtPayload, reason?: string) {
        try {
            // Validate UUID
            if (!ValidationHelper.isValidateUUIDv4(jobId)) {
                throw new BadRequestException(GlobalErrorType.INVALID_ID);
            }

            const isAdmin = user.roles.includes(Role.ADMIN);

            let condition = {};
            if (isAdmin) {
                condition = { jobId: jobId };
            } else {
                condition = { jobId: jobId, enterprise: { enterpriseId: user.enterpriseId } };
            }

            const existingJob = await this.jobRepository.findOne({
                where: condition,
                relations: ['enterprise'],
                select: {
                    enterprise: {
                        enterpriseId: true,
                        name: true,
                        email: true,
                    },
                },
            });

            if (!existingJob) {
                throw new NotFoundException(JobErrorType.JOB_NOT_FOUND);
            }

            if (existingJob.status === JobStatusEnum.CLOSED) {
                throw new WarningException(JobErrorType.JOB_IS_CLOSED);
            }

            await this.jobRepository.update({ jobId }, { status: JobStatusEnum.CLOSED, deadline: new Date() });

            if (isAdmin) {
                // send email notification to enterprise
                const defaultReason =
                    'Your job posting may have violated our platform rules or guidelines. If you believe this is an error, please contact our support team.';
                this.mailService.sendJobClosureNotificationMail(
                    existingJob.enterprise.email,
                    existingJob.name,
                    existingJob.jobId,
                    existingJob.enterprise.name,
                    reason || defaultReason
                );
            }

            // Update embedding
            await this.embeddingService.deleteOneJobEmbedding(jobId);

            // clear filter search cache
            this.cacheService.removeSearchJobsCache();
            this.cacheService.removeEnterpriseSearchJobsCache();

            return new JobResponseDtoBuilder().setValue(null).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async changeStatus(jobId: string, payload: UpdateJobStatusDto) {
        try {
            // Validate UUID
            if (!ValidationHelper.isValidateUUIDv4(jobId)) {
                throw new BadRequestException(GlobalErrorType.INVALID_ID);
            }

            // Find the job
            const existingJob = await this.jobRepository.findOne({
                where: { jobId: jobId },
                relations: ['enterprise'],
                select: {
                    enterprise: {
                        enterpriseId: true,
                        name: true,
                        email: true,
                    },
                },
            });

            if (!existingJob) {
                throw new NotFoundException(JobErrorType.JOB_NOT_FOUND);
            }

            if (existingJob.status === payload.status) {
                throw new WarningException(JobErrorType.JOB_SAME_STATUS);
            }

            // Update job status to OPEN with new deadline
            await this.jobRepository.update(
                { jobId },
                {
                    status: payload.status,
                }
            );

            // Send email notification to enterprise about reopened job
            this.mailService.sendJobChangeStatusNotificationMail(
                existingJob.enterprise.email,
                existingJob.name,
                existingJob.jobId,
                existingJob.enterprise.name,
                payload.reason
            );

            // Update embedding
            await this.embeddingService.createJobEmbedding(jobId);

            // Clear cache to reflect changes
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

            await this.embeddingService.deleteManyJobEmbedding(jobs.map((job) => job.jobId));
            return result;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async estimateRankIfBoost(jobId: string, plusPoints: number) {
        try {
            const job = await this.jobRepository.findOne({
                where: { jobId },
                relations: ['categories'],
            });
            if (!job) throw new NotFoundException(JobErrorType.JOB_NOT_FOUND);

            const currentTotal = await this.boostJobService.getTotalPointsByJobId(jobId);
            const projectedTotal = currentTotal + plusPoints;

            const others = await this.boostJobService.getAllBoostedJobsWithTotalPointsByCategories(
                job.categories.map((category) => category.categoryId),
                jobId
            );

            const allJobs = [...others, { jobId, total: projectedTotal }];
            allJobs.sort((a, b) => b.total - a.total);

            const rank = allJobs.findIndex((j) => j.jobId === jobId) + 1;

            const temp = {
                estimatedRank: rank,
                projectedBoost: projectedTotal,
                plusPoints,
                totalJobs: allJobs.length,
            };
            return new JobResponseDtoBuilder().setValue(temp).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async getJobByIdEnterprise(id: string, take: number) {
        try {
            const jobs = await this.jobRepository.find({
                where: { enterprise: { enterpriseId: id }, status: JobStatusEnum.OPEN },
                take: take,
                order: { createdAt: 'DESC' },
            });
            return jobs;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
    public async getTotalAppliedJob(jobId: string): Promise<number> {
        try {
            const job = await this.jobRepository.findOne({
                where: { jobId },
                relations: ['appliedJob'],
            });
            return job?.appliedJob?.length || 0;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async updateBoostJob(jobId: string, point: number) {
        try {
            const result = await this.jobRepository.update({ jobId }, { isBoost: true });

            // Update embedding
            await this.embeddingService.createJobEmbedding(jobId);

            return result;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async applyJob(
        jobId: string,
        accountId: string,
        body: { cvId: string; coverLetter?: string }
    ): Promise<JobResponseDto> {
        try {
            // Validate UUID
            if (!ValidationHelper.isValidateUUIDv4(jobId)) {
                throw new BadRequestException(GlobalErrorType.INVALID_ID);
            }

            // Check if job exists and is open
            const job = await this.jobRepository.findOne({
                where: {
                    jobId,
                    status: JobStatusEnum.OPEN,
                    deadline: MoreThan(new Date()),
                },
                relations: ['enterprise'],
                select: {
                    enterprise: {
                        enterpriseId: true,
                        name: true,
                        email: true,
                    },
                },
            });

            if (!job) {
                throw new NotFoundException(JobErrorType.JOB_NOT_FOUND);
            }

            // Check if user is trying to apply to their own job
            if (job.enterprise.enterpriseId === accountId) {
                throw new BadRequestException(JobErrorType.CAN_NOT_APPLY_OWN_JOB);
            }

            // Check if user has already applied
            const existingApplication = await this.jobRepository
                .createQueryBuilder('jobs')
                .innerJoin('jobs.appliedJob', 'appliedJobs')
                .where('jobs.jobId = :jobId', { jobId })
                .andWhere('appliedJobs.accountId = :accountId', { accountId })
                .getOne();

            if (existingApplication) {
                throw new BadRequestException(AppliedJobErrorType.ALREADY_APPLIED);
            }

            // Create application with CV and cover letter
            await this.jobRepository.createQueryBuilder().relation(JobEntity, 'appliedJob').of(jobId).add({
                accountId,
                cvId: body.cvId,
                coverLetter: body.coverLetter,
                appliedAt: new Date(),
                status: 'PENDING',
            });

            // Clear cache
            this.cacheService.removeSearchJobsCache();
            this.cacheService.removeEnterpriseSearchJobsCache();

            return new JobResponseDtoBuilder().setValue(null).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async getDetailJob(id: string) {
        try {
            const job = await this.jobRepository.findOne({
                where: { jobId: id },
            });
            return job;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async searchJobs(query) {
        try {
            const {
                tags,
                location,
                lowestWage,
                highestWage,
                type,
                education,
                name,
                status = JobStatusEnum.OPEN,
            } = query;

            // Build base query with all needed relations
            const queryBuilder = this.jobRepository
                .createQueryBuilder('jobs')
                .leftJoinAndSelect('jobs.addresses', 'addresses')
                .leftJoinAndSelect('jobs.categories', 'categories')
                .leftJoinAndSelect('jobs.specializations', 'specializations')
                .leftJoinAndSelect('jobs.enterprise', 'enterprise')
                .leftJoinAndSelect('jobs.boostedJob', 'boosted_jobs')
                .leftJoinAndSelect('jobs.tags', 'tags');

            // Apply filters
            if (name?.trim()) {
                queryBuilder.andWhere(
                    new Brackets((qb) => {
                        qb.where("to_tsvector('english', jobs.name) @@ plainto_tsquery(:name)", {
                            name: name.trim(),
                        })
                            .orWhere('jobs.name ILIKE :namePattern', {
                                namePattern: `%${name.trim()}%`,
                            })
                            .orWhere('jobs.description ILIKE :namePattern', {
                                namePattern: `%${name.trim()}%`,
                            });
                    })
                );
            }

            if (location?.trim()) {
                queryBuilder.andWhere(
                    new Brackets((qb) => {
                        qb.where('addresses.country ILIKE :locationPattern', {
                            locationPattern: `%${location.trim()}%`,
                        })
                            .orWhere('addresses.city ILIKE :locationPattern', {
                                locationPattern: `%${location.trim()}%`,
                            })
                            .orWhere('addresses.street ILIKE :locationPattern', {
                                locationPattern: `%${location.trim()}%`,
                            });
                    })
                );
            }

            if (tags?.length > 0) {
                queryBuilder.andWhere(
                    new Brackets((qb) => {
                        qb.where('categories.categoryName = ANY(:tags)', { tags })
                            .orWhere('specializations.categoryName = ANY(:tags)', { tags })
                            .orWhere('tags.name = ANY(:tags)', { tags });
                    })
                );
            }

            if (lowestWage !== undefined) {
                queryBuilder.andWhere('jobs.lowestWage >= :lowestWage', {
                    lowestWage: Number(lowestWage),
                });
            }

            if (highestWage !== undefined) {
                queryBuilder.andWhere('jobs.highestWage <= :highestWage', {
                    highestWage: Number(highestWage),
                });
            }

            if (type?.length > 0) {
                queryBuilder.andWhere('jobs.type = ANY(:type)', { type });
            }

            if (education?.length > 0) {
                queryBuilder.andWhere('jobs.education = ANY(:education)', { education });
            }

            // Only show jobs with future deadlines and specified status
            queryBuilder.andWhere('jobs.deadline > CURRENT_DATE').andWhere('jobs.status = :status', { status });

            // Select fields
            queryBuilder.select([
                'jobs.jobId',
                'jobs.name',
                'jobs.description',
                'jobs.introImg',
                'jobs.type',
                'jobs.experience',
                'jobs.deadline',
                'jobs.status',
                'jobs.updatedAt',
                'jobs.createdAt',
                'jobs.education',
                'jobs.highestWage',
                'jobs.lowestWage',
                'addresses.addressId',
                'addresses.country',
                'addresses.city',
                'addresses.street',
                'addresses.zipCode',
                'categories.categoryId',
                'categories.categoryName',
                'specializations.categoryId',
                'specializations.categoryName',
                'enterprise.enterpriseId',
                'enterprise.name',
                'enterprise.logoUrl',
                'enterprise.status',
                'tags.tagId',
                'tags.name',
                'tags.color',
                'boosted_jobs.id',
                'boosted_jobs.boostedAt',
                'boosted_jobs.pointsUsed',
            ]);

            // Apply ordering with NULLS handling
            queryBuilder
                .addOrderBy('boosted_jobs.pointsUsed', 'DESC', 'NULLS LAST')
                .addOrderBy('boosted_jobs.boostedAt', 'ASC', 'NULLS LAST')
                .addOrderBy('jobs.deadline', 'ASC')
                .addOrderBy('jobs.updatedAt', 'DESC');

            const jobs = await queryBuilder.getMany();
            return jobs;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async getTotalJob() {
        try {
            return this.jobRepository.count();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
    async getRelatedJobsByJobId(ids: string[]) {
        try {
            const jobs = await this.jobRepository.find({
                where: { jobId: In(ids) },
                select: {
                    jobId: true,
                    name: true,
                    description: true,
                    responsibility: true,
                    type: true,
                    experience: true,
                    deadline: true,
                    introImg: true,
                    status: true,
                    education: true,
                    lowestWage: true,
                    highestWage: true,
                    isBoost: true,
                    requirements: true,
                    createdAt: true,
                    updatedAt: true,
                    enterprise: {
                        enterpriseId: true,
                        name: true,
                        logoUrl: true,
                        status: true,
                    },
                    categories: {
                        categoryId: true,
                        categoryName: true,
                    },
                    specializations: {
                        categoryId: true,
                        categoryName: true,
                    },
                    tags: {
                        tagId: true,
                        name: true,
                        color: true,
                    },
                    addresses: {
                        addressId: true,
                        country: true,
                        city: true,
                        street: true,
                        zipCode: true,
                    },
                    boostedJob: {
                        id: true,
                        boostedAt: true,
                        pointsUsed: true,
                    },
                },
                relations: ['enterprise', 'categories', 'specializations', 'tags', 'addresses', 'boostedJob'],
            });
            return jobs;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
