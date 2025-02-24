import { Inject, Injectable, Query } from '@nestjs/common';
import { JwtPayload, PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { JobRepository } from '../repositories';
import { RedisCommander } from 'ioredis';
import { JobEntity } from '@database/entities';
import { JobErrorType } from '@common/errors/';
import { ErrorType } from '@common/enums';
import { CreateJobWishListDto, CreateJobDto, JobResponseDto, JobResponseDtoBuilder, JobFilterDto } from '../dtos';
import { AddressService } from '@modules/address/service/address.service';
import { CategoryService } from '@modules/category/services';
import { TagService } from '@modules/tag/services';
import { EnterpriseService } from '@modules/enterprise/service/enterprise.service';

@Injectable()
export class JobService {
    constructor(
        private readonly jobRepository: JobRepository,
        private readonly addressService: AddressService,
        private readonly categoryService: CategoryService,
        private readonly enterpriseService: EnterpriseService,
        private readonly tagService: TagService,
        @Inject('CACHE_INSTANCE') private readonly redisCache: RedisCommander
    ) {}

    async create(createJobDto: CreateJobDto, accountId: string) {
        const { address, categoryIds, tagIds, enterpriseId, ...jobData } = createJobDto;

        const [enterprise, addresses, categories, tags] = await Promise.all([
            this.enterpriseService.getEnterpriseByAccountId(accountId),
            this.addressService.getAddressByIds(address),
            this.categoryService.findByIds(categoryIds),
            this.tagService.findByIds(tagIds),
        ]);

        const newJob = this.jobRepository.create({
            ...jobData,
            enterprise,
            addresses,
            categories,
            tags,
        });
        await this.jobRepository.save(newJob);
        return new JobResponseDtoBuilder().setValue(newJob).success().build();
    }

    async getAllJobs(options: PaginationDto): Promise<JobResponseDto> {
        try {
            const [profiles, total] = await this.jobRepository.findAndCount({
                skip: (Number(options.page) - 1) * Number(options.take),
                take: Number(options.take),
                relations: ['enterprise', 'addresses'],
            });

            const meta = new PageMetaDto({
                pageOptionsDto: options,
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
        return await this.jobRepository.findOne({ where: { jobId: id } });
    }
}
