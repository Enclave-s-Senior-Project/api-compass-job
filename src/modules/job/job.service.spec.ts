import { AddressService } from '@modules/address/service/address.service';
import { JobRepository } from './repositories';
import { JobService } from './service/job.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from '@modules/category/services';
import { EnterpriseService } from '@modules/enterprise/service/enterprise.service';
import { TagService } from '@modules/tag/services';
import { redisProviderName } from '@cache/cache.provider';
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

            await expect(service.getJobOfEnterprise(enterpriseId, paginationDto)).rejects.toThrow('Database error');
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
});
