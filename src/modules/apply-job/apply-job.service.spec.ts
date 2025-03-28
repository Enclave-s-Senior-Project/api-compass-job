import { Test, TestingModule } from '@nestjs/testing';
import { CvService } from '@modules/cv/services/cv.service';
import { UserService } from '@modules/user/service';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { GlobalErrorType } from '@src/common/errors/global-error';
import { ValidationHelper } from '@src/helpers/validation.helper';
import { ApplyJobService } from './services/apply-job.service';
import { ApplyJobRepository } from './repositories/apply-job.repository';
import { JobService } from '../job/service/job.service';
import { AppliedJobEntity, CvEntity, JobEntity, ProfileEntity } from '@src/database/entities';

describe('ApplyJobService', () => {
    let service: ApplyJobService;
    let applyJobRepository: ApplyJobRepository;

    const mockApplyJobRepository = {
        findAndCount: jest.fn(),
    };

    const mockJobService = {};
    const mockCvService = {};
    const mockUserService = {};

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ApplyJobService,
                {
                    provide: ApplyJobRepository,
                    useValue: mockApplyJobRepository,
                },
                {
                    provide: JobService,
                    useValue: mockJobService,
                },
                {
                    provide: CvService,
                    useValue: mockCvService,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
            ],
        }).compile();

        service = module.get<ApplyJobService>(ApplyJobService);
        applyJobRepository = module.get<ApplyJobRepository>(ApplyJobRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAppliedJobByProfileId', () => {
        const validProfileId = '123e4567-e89b-12d3-a456-426614174000';
        const pagination: PaginationDto = {
            page: 1,
            take: 10,
            skip: 0,
        };

        const mockAppliedJobs: AppliedJobEntity[] = [
            {
                appliedJobId: '123e4567-e89b-12d3-a456-426614174000',
                coverLetter: 'Test Cover Letter1',
                status: true,
                isDenied: false,
                profile: new ProfileEntity(),
                job: new JobEntity(),
                cv: new CvEntity(),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                appliedJobId: '123e4567-e89b-12d3-a456-426614174001',
                coverLetter: 'Test Cover Letter2',
                status: false,
                isDenied: false,
                profile: new ProfileEntity(),
                job: new JobEntity(),
                cv: new CvEntity(),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        it('should return applied jobs successfully', async () => {
            jest.spyOn(ValidationHelper, 'isValidateUUIDv4').mockReturnValue(true);
            mockApplyJobRepository.findAndCount.mockResolvedValue([mockAppliedJobs, 2]);

            const result = await service.getAppliedJobByProfileId(validProfileId, pagination);

            expect(result).toBeDefined();
            expect(result.code).toEqual(HttpStatus.OK);
            expect(result.value).toBeInstanceOf(PageDto);
            expect(result.value?.data).toBeInstanceOf(Array<AppliedJobEntity>);
            expect(result.value?.meta).toBeInstanceOf(PageMetaDto);
            expect(result.value?.meta?.itemCount).toBe(2);
            expect(result.value?.data).toEqual(mockAppliedJobs);
        });

        it('should throw BadRequestException for invalid UUID', async () => {
            jest.spyOn(ValidationHelper, 'isValidateUUIDv4').mockReturnValue(false);

            await expect(service.getAppliedJobByProfileId('invalid-uuid', pagination)).rejects.toThrow(
                new BadRequestException(GlobalErrorType.INVALID_ID)
            );
        });

        it('should handle empty results', async () => {
            jest.spyOn(ValidationHelper, 'isValidateUUIDv4').mockReturnValue(true);
            mockApplyJobRepository.findAndCount.mockResolvedValue([[], 0]);

            const result = await service.getAppliedJobByProfileId(validProfileId, pagination);

            expect(result).toBeDefined();
            expect(result.code).toEqual(HttpStatus.OK);
            expect(result.value).toBeInstanceOf(PageDto);
            expect(result.value?.data).toBeInstanceOf(Array<AppliedJobEntity>);
            expect(result.value?.meta).toBeInstanceOf(PageMetaDto);
            expect(result.value?.meta?.itemCount).toBe(0);
            expect(result.value?.data).toEqual([]);
        });

        it('should handle repository errors', async () => {
            jest.spyOn(ValidationHelper, 'isValidateUUIDv4').mockReturnValue(true);
            mockApplyJobRepository.findAndCount.mockRejectedValue(new Error('Database error'));

            await expect(service.getAppliedJobByProfileId(validProfileId, pagination)).rejects.toThrow();
        });

        it('should use correct pagination parameters', async () => {
            jest.spyOn(ValidationHelper, 'isValidateUUIDv4').mockReturnValue(true);
            mockApplyJobRepository.findAndCount.mockResolvedValue([mockAppliedJobs, 2]);

            await service.getAppliedJobByProfileId(validProfileId, pagination);

            expect(mockApplyJobRepository.findAndCount).toHaveBeenCalledWith({
                skip: 0,
                take: 10,
                where: { profile: { profileId: validProfileId } },
                relations: ['profile', 'job'],
            });
        });
    });
});
