import { AddressService } from '@modules/address/service/address.service';
import { JobRepository } from './repositories';
import { JobService } from './service/job.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from '@modules/category/services';
import { EnterpriseService } from '@modules/enterprise/service/enterprise.service';
import { TagService } from '@modules/tag/services';
import { redisProviderName } from '@cache/cache.provider';
import { PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { AddressEntity, CategoryEntity, EnterpriseEntity, JobEntity, TagEntity } from '@src/database/entities';
import { ValidationHelper } from '@src/helpers/validation.helper';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('JobService', () => {
    let service: JobService;
    let jobRepository: JobRepository;

    const mockJobRepository = {
        findAndCount: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
    };

    const mockAddressService = {};
    const mockCategoryService = {};
    const mockEnterpriseService = {};
    const mockTagService = {};
    const mockRedisCache = {};

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JobService,
                {
                    provide: JobRepository,
                    useValue: mockJobRepository,
                },
                {
                    provide: AddressService,
                    useValue: mockAddressService,
                },
                {
                    provide: CategoryService,
                    useValue: mockCategoryService,
                },
                {
                    provide: EnterpriseService,
                    useValue: mockEnterpriseService,
                },
                {
                    provide: TagService,
                    useValue: mockTagService,
                },
                {
                    provide: redisProviderName,
                    useValue: mockRedisCache,
                },
            ],
        }).compile();

        service = module.get<JobService>(JobService);
        jobRepository = module.get<JobRepository>(JobRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getJobOfEnterprise', () => {
        const enterpriseId = '123';
        const paginationDto: PaginationDto = {
            page: 1,
            take: 10,
            skip: 0,
        };

        const mockJobs = [
            { id: '1', title: 'Test Job', applicationCount: 0 },
            { id: '2', title: 'Test Job2', applicationCount: 0 },
        ];

        it('should return paginated jobs successfully', async () => {
            const total = 2;
            mockJobRepository.findAndCount.mockResolvedValue([mockJobs, total]);

            const result = await service.getJobOfEnterprise(enterpriseId, paginationDto);

            expect(result).toBeInstanceOf(PageDto);
            expect(result.data).toEqual(mockJobs);
            expect(result.meta).toBeInstanceOf(PageMetaDto);
            expect(result.meta.itemCount).toEqual(total);
            expect(result.meta.page).toEqual(1);
            expect(result.meta.pageCount).toEqual(1);
            expect(result.meta.hasNextPage).toBe(false);
            expect(result.meta.hasPreviousPage).toBe(false);
        });

        it('should handle pagination with custom page and take values', async () => {
            const customPagination: PaginationDto = {
                page: 2,
                take: 1,
                skip: 1,
            };
            const total = 2;
            mockJobRepository.findAndCount.mockResolvedValue([[mockJobs[1]], total]);

            const result = await service.getJobOfEnterprise(enterpriseId, customPagination);

            expect(result).toBeInstanceOf(PageDto);
            expect(result.data).toEqual([mockJobs[1]]);
            expect(result.meta.page).toEqual(2);
            expect(result.meta.pageCount).toEqual(2);
            expect(result.meta.hasNextPage).toBe(false);
            expect(result.meta.hasPreviousPage).toBe(true);
        });

        it('should throw an error when repository fails', async () => {
            const error = new Error('Database error');
            mockJobRepository.findAndCount.mockRejectedValue(error);

            await expect(service.getJobOfEnterprise(enterpriseId, paginationDto)).rejects.toThrow(
                InternalServerErrorException
            );
        });

        it('should return empty result set when no jobs are found', async () => {
            mockJobRepository.findAndCount.mockResolvedValue([[], 0]);

            const result = await service.getJobOfEnterprise(enterpriseId, paginationDto);

            expect(result).toBeInstanceOf(PageDto);
            expect(result.data).toEqual([]);
            expect(result.meta.itemCount).toEqual(0);
            expect(result.meta.page).toEqual(1);
            expect(result.meta.pageCount).toEqual(0);
            expect(result.meta.hasNextPage).toBe(false);
            expect(result.meta.hasPreviousPage).toBe(false);
        });
    });

    describe('updateJob', () => {
        const jobId = '24bd5aa6-5146-4f23-b9c6-f34b96650b13';
        const user = { enterpriseId: '24bd5aa6-5146-4f23-b9c6-f34b96650b13' };
        const updatePayload: Partial<JobEntity> = {
            name: 'Updated Job Name',
            lowestWage: 50000,
            highestWage: 100000,
            description: 'Updated description',
            responsibility: 'Updated responsibility',
            type: 'Full-time',
            experience: 3,
            deadline: new Date(),
            introImg: 'updated-image-url',
            status: true,
            education: 'Bachelor',
            enterpriseBenefits: 'Health Insurance',
            tags: [new TagEntity(), new TagEntity()],
            categories: [new CategoryEntity()],
            addresses: [new AddressEntity()],
            specializations: [new CategoryEntity()],
        };

        const existingJob: Partial<JobEntity> = {
            jobId,
            enterprise: new EnterpriseEntity(),
            name: 'Old Job Name',
            ...updatePayload,
        };

        it('should update the job successfully', async () => {
            jest.spyOn(jobRepository, 'findOne').mockResolvedValue(existingJob as any);
            jest.spyOn(jobRepository, 'update').mockResolvedValue({ ...existingJob, ...updatePayload } as any);
            jest.spyOn(service, 'clearFilterJobResultOnCache').mockResolvedValue(true);

            const result = await service.updateJob(jobId, updatePayload, user as any);

            expect(jobRepository.findOne).toHaveBeenCalled();
            expect(jobRepository.update).toHaveBeenCalled();
            expect(service.clearFilterJobResultOnCache).toHaveBeenCalled();
            expect(result.value).toEqual({ ...existingJob, ...updatePayload });
        });

        it('should throw BadRequestException for invalid jobId', async () => {
            jest.spyOn(ValidationHelper, 'isValidateUUIDv4').mockReturnValue(false);

            await expect(service.updateJob('invalid-id', updatePayload, user as any)).rejects.toThrow(
                BadRequestException
            );
            expect(ValidationHelper.isValidateUUIDv4).toHaveBeenCalledWith('invalid-id');
        });

        it('should throw NotFoundException if job does not exist', async () => {
            jest.spyOn(ValidationHelper, 'isValidateUUIDv4').mockReturnValue(true);
            jest.spyOn(jobRepository, 'findOne').mockResolvedValue(null);

            await expect(service.updateJob(jobId, updatePayload, user as any)).rejects.toThrow(NotFoundException);
            expect(jobRepository.findOne).toHaveBeenCalledWith({
                where: { jobId, enterprise: { enterpriseId: user.enterpriseId } },
                relations: ['enterprise'],
            });
        });

        it('should handle errors during update', async () => {
            const error = new Error('Database error');
            jest.spyOn(ValidationHelper, 'isValidateUUIDv4').mockReturnValue(true);
            jest.spyOn(jobRepository, 'findOne').mockResolvedValue(existingJob as any);
            jest.spyOn(jobRepository, 'update').mockRejectedValue(error);

            await expect(service.updateJob(jobId, updatePayload, user as any)).rejects.toThrow(
                InternalServerErrorException
            );
            expect(jobRepository.update).toHaveBeenCalled();
        });
    });
});
