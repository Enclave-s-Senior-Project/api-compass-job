import { Inject, Injectable } from '@nestjs/common';
import { CreateJobDto } from '../dtos/create-job.dto';
import { UpdateJobDto } from '../dtos/update-job.dto';
import { PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { JobRepository } from '../repositories';
import { RedisCommander } from 'ioredis';
import { JobResponseDto, JobResponseDtoBuilder } from '../dtos/job-response.dto';
import { JobEntity } from '@database/entities';
import { JobErrorType } from '@common/errors/';
import { JobFilterDto } from '../dtos/job-filter.dto';
import { AddressRepository } from '@modules/address/repositories/address.repository';
import { CategoryRepository } from '@modules/category/repositories';
import { TagRepository } from '@modules/tag/repositories';
import { AddressService } from '@modules/address/service/address.service';
import { CategoryService } from '@modules/category/services';
import { TagService } from '@modules/tag/services';

@Injectable()
export class JobService {
    constructor(
        private readonly jobRepository: JobRepository,
        private readonly addressService: AddressService,
        private readonly categoryService: CategoryService,
        private readonly tagService: TagService,
        @Inject('CACHE_INSTANCE') private readonly redisCache: RedisCommander
    ) {}
    async create(createJobDto: CreateJobDto) {
        const { address, categoryIds, tagIds, enterpriseId, ...jobData } = createJobDto;
        const addresses = await this.addressService.getAddressByIds(address);
        const categories = await this.categoryService.findByIds(categoryIds);
        const tags = await this.tagService.findByIds(tagIds);

        const newJob = this.jobRepository.create({
            ...jobData,
            addresses,
            categories,
            tags,
        });

        return this.jobRepository.save(newJob);
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
}
