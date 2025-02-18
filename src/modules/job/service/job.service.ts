import { Inject, Injectable } from '@nestjs/common';
import { CreateJobDto } from '../dtos/create-job.dto';
import { UpdateJobDto } from '../dtos/update-job.dto';
import { PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { JobRepository } from '../repositories';
import { RedisCommander } from 'ioredis';
import { JobResponseDto, JobResponseDtoBuilder } from '../dtos/job-response.dto';
import { JobEntity } from '@database/entities';
import { JobErrorType } from '@common/errors/job-error-type';
import { JobFilterDto } from '../dtos/job-filter.dto';

@Injectable()
export class JobService {
    constructor(
        private readonly jobRespository: JobRepository,
        @Inject('CACHE_INSTANCE') private readonly redisCache: RedisCommander
    ) {}
    create(createJobDto: CreateJobDto) {
        return 'This action adds a new job';
    }

    async getAllJobs(options: PaginationDto): Promise<JobResponseDto> {
        try {
            console.log('12', options);
            const [profiles, total] = await this.jobRespository.findAndCount({
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
            const [profiles, total] = await this.jobRespository.findAndCount({
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
