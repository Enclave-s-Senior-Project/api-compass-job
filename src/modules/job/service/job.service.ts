import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtPayload, PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { JobRepository } from '../repositories';
import Redis, { RedisCommander } from 'ioredis';
import { JobEntity } from '@database/entities';
import { JobErrorType } from '@common/errors/';
import { ErrorType } from '@common/enums';
import { CreateJobWishListDto, CreateJobDto, JobResponseDto, JobResponseDtoBuilder, JobFilterDto } from '../dtos';
import { AddressService } from '@modules/address/service/address.service';
import { CategoryService } from '@modules/category/services';
import { TagService } from '@modules/tag/services';
import { EnterpriseService } from '@modules/enterprise/service/enterprise.service';
import { redisProviderName } from '@cache/cache.provider';
import { ErrorCatchHelper } from 'src/helpers/error-catch.helper';

@Injectable()
export class JobService {
    constructor(
        private readonly jobRepository: JobRepository,
        private readonly addressService: AddressService,
        private readonly categoryService: CategoryService,
        private readonly enterpriseService: EnterpriseService,
        private readonly tagService: TagService,
        @Inject(redisProviderName) private readonly redisCache: Redis
    ) {}

    async create(createJobDto: Omit<CreateJobDto, 'enterpriseId'>, accountId: string, enterpriseId: string) {
        try {
            // clear all jobs filter results while creating
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

            const hasInvalidSpecialization = specializations.some(
                (spec) => !spec.isChild || !categories.some((cat) => spec.parent?.categoryId === cat.categoryId)
            );

            if (hasInvalidSpecialization) {
                return new JobResponseDtoBuilder().setCode(400).setMessageCode(JobErrorType.JOB_SPECIALIZATION).build();
            }

            const newJob = this.jobRepository.create({
                ...jobData,
                enterprise,
                addresses,
                categories,
                tags,
                specializations,
            });

            await this.jobRepository.save(newJob);
            return new JobResponseDtoBuilder().setValue(newJob).success().build();
        } catch (error) {
            console.error('Error creating job:', error);
            return new JobResponseDtoBuilder().setCode(400).setMessageCode(JobErrorType.FETCH_JOB_FAILED).build();
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

    async getDetailJobById(id: string, user: JwtPayload): Promise<JobResponseDto> {
        try {
            const job = await this.jobRepository.findOne({
                where: { jobId: id },
                relations: ['tags', 'enterprise', 'addresses', 'profiles'],
            });
            if (!job) {
                return new JobResponseDtoBuilder().badRequestContent(JobErrorType.JOB_NOT_FOUND).build();
            }
            const isFavorite = job.profiles?.some((profile) => profile.profileId === user.profileId);
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
            // Check cache
            const resultCache = await this.getFilterResultOnCache(urlQuery);
            if (resultCache && resultCache?.length > 0) {
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

            // Start QueryBuilder
            const queryBuilder = this.jobRepository
                .createQueryBuilder('jobs')
                .leftJoinAndSelect('jobs.addresses', 'addresses')
                .leftJoinAndSelect('jobs.categories', 'industries')
                .leftJoinAndSelect('jobs.specializations', 'majorities')
                .leftJoinAndSelect('jobs.enterprise', 'enterprise');

            // Optimize Full-Text Search (Uses `plainto_tsquery`)
            if (query.name) {
                queryBuilder.andWhere("to_tsvector('english', jobs.name) @@ plainto_tsquery(:name)", {
                    name: query.name.trim(),
                });
            }

            // Optimize Country and City Filters
            if (query.country) {
                queryBuilder.andWhere('LOWER(addresses.country) LIKE LOWER(:country)', {
                    country: `${query.country}%`,
                });
            }
            if (query.city) {
                queryBuilder.andWhere('LOWER(addresses.city) LIKE LOWER(:city)', { city: `${query.city}%` });
            }

            // Optimize Category Filters (Indexes Needed)
            if (query.industryCategoryId) {
                queryBuilder.andWhere('industries.category_id = :industryId', { industryId: query.industryCategoryId });
            }
            if (query.majorityCategoryId) {
                queryBuilder.andWhere('majorities.category_id = :majorityId', { majorityId: query.majorityCategoryId });
            }

            // Status and Deadline Check
            queryBuilder.andWhere('jobs.status = true AND jobs.deadline > CURRENT_DATE');

            // Select only necessary fields (Avoid SELECT *)
            queryBuilder.select([
                'jobs.jobId',
                'jobs.name',
                'jobs.status',
                'jobs.deadline',
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
                'enterprise.logoUrl',
                'enterprise.backgroundImageUrl',
                'enterprise.foundedIn',
                'enterprise.industryType',
                'enterprise.isPremium',
            ]);

            // Prioritize Premium Enterprises
            queryBuilder.orderBy('enterprise.isPremium', 'DESC');

            queryBuilder.skip(query.skip).take(query.take);

            // Execute Query
            const [jobs, total] = await queryBuilder.getManyAndCount();

            // Cache results
            this.storeFilterResultOnCache(urlQuery, jobs);

            // Return response
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
            return new JobResponseDtoBuilder().setValue(new PageDto(jobs, meta)).build();
        } catch (error) {
            console.error('Filter Query Error:', error);
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    protected async storeFilterResultOnCache(key: string, results: JobEntity[]) {
        const cacheKey = `jobfilter:${key}`;
        await this.redisCache.set(cacheKey, JSON.stringify(results), 'EX', 60 * 60 * 24); // Cache for 1 day
    }

    protected async getFilterResultOnCache(key: string): Promise<JobEntity[] | null> {
        const cacheResult = await this.redisCache.get(`jobfilter:${key}`);
        return JSON.parse(cacheResult) || null;
    }

    protected async clearFilterJobResultOnCache() {
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
}
