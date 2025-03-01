import { AddressService } from '@modules/address/service/address.service';
import { JobRepository } from './repositories';
import { JobService } from './service/job.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from '@modules/category/services';
import { EnterpriseService } from '@modules/enterprise/service/enterprise.service';
import { TagService } from '@modules/tag/services';
import { redisProviderName } from '@cache/cache.provider';
import { JobResponseDto } from './dtos';
import { PageDto, PageMetaDto, PaginationDto } from '@common/dtos';

describe('JobService', () => {
    let service: JobService;
    let jobRepository: JobRepository;

    const mockJobRepository = {
        findAndCount: jest.fn(),
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
            { id: '1', title: 'Test Job' },
            { id: '2', title: 'Test Job2' },
        ];

        it('should return jobs successfully with pagination', async () => {
            const total = 2;
            mockJobRepository.findAndCount.mockResolvedValue([mockJobs, total]);

            const result = await service.getJobOfEnterprise(enterpriseId, paginationDto);

            expect(result).toBeInstanceOf(JobResponseDto);
            expect(result.value).toBeInstanceOf(PageDto);
            expect(result.value).toEqual({
                data: mockJobs,
                meta: { hasNextPage: false, hasPreviousPage: false, itemCount: total, page: 1, pageCount: 1, take: 10 },
            });
            expect(result.value.meta).toBeInstanceOf(PageMetaDto);
            expect(result.value.meta.itemCount).toEqual(total);
        });

        // it('should handle pagination correctly with different page and take values', async () => {
        //     const customPagination: PaginationDto = {
        //         page: 2,
        //         take: 1,
        //         skip: 1, // (2-1) * 5
        //     };
        //     const total = 1;
        //     mockJobRepository.findAndCount.mockResolvedValue([mockJobs, total]);

        //     const result = await service.getJobOfEnterprise(enterpriseId, customPagination);

        //     expect(result.value).toEqual({"data": mockJobs.slice(1), "meta": {"hasNextPage": false, "hasPreviousPage": true, "itemCount": 1, "page": 2, "pageCount": 2, "take": 1}});
        //     expect(result.value.meta.itemCount).toEqual(total);
        // });

        // it('should return error response when repository throws an error', async () => {
        //     const error = new Error('Database error');
        //     mockJobRepository.findAndCount.mockRejectedValue(error);

        //     const result = await service.getJobOfEnterprise(enterpriseId, paginationDto);

        //     expect(result).toBeInstanceOf(JobResponseDtoBuilder);
        //     expect(result.code).toEqual(500);
        //     expect(result.messageCode).toEqual(ErrorType.InternalErrorServer);
        //     expect(result.data).toBeUndefined();
        // });

        // it('should handle empty result set', async () => {
        //     mockJobRepository.findAndCount.mockResolvedValue([[], 0]);

        //     const result = await service.getJobOfEnterprise(enterpriseId, paginationDto);

        //     expect(result).toBeInstanceOf(JobResponseDtoBuilder);
        //     expect(result.data.data).toEqual([]);
        //     expect(result.data.meta.itemCount).toEqual(0);
        //     expect(result.code).toBeUndefined();
        // });
    });
});
