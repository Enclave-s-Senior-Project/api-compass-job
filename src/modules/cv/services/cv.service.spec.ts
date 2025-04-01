import { Test, TestingModule } from '@nestjs/testing';
import { CvService } from './cv.service';
import { CvRepository } from '../repositories/cv.repository';
import { NotFoundException } from '@nestjs/common';
import { CvResponseDtoBuilder } from '../dtos/cv-response.dto';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';

describe('CvService', () => {
    let service: CvService;
    let repository: CvRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CvService,
                {
                    provide: CvRepository,
                    useValue: {
                        findOne: jest.fn(),
                        find: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        exists: jest.fn(),
                        update: jest.fn(),
                        delete: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<CvService>(CvService);
        repository = module.get<CvRepository>(CvRepository);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getCvByID', () => {
        it('should return a CV entity', async () => {
            const mockCv = { cvId: '1' };
            jest.spyOn(repository, 'findOne').mockResolvedValue(mockCv as any);

            const result = await service.getCvByID('1');
            expect(result).toEqual(mockCv);
            expect(repository.findOne).toHaveBeenCalledWith({ where: { cvId: '1' } });
        });
    });

    describe('getOwnCV', () => {
        it('should return a list of CVs', async () => {
            const mockCvs = [{ cvId: '1' }];
            jest.spyOn(repository, 'find').mockResolvedValue(mockCvs as any);

            const result = await service.getOwnCV('profileId');
            expect(result).toEqual(new CvResponseDtoBuilder().setValue(mockCvs).success().build());
            expect(repository.find).toHaveBeenCalledWith({ where: { profile: { profileId: 'profileId' } } });
        });

        it('should handle errors', async () => {
            jest.spyOn(repository, 'find').mockRejectedValue(new Error('Error'));
            jest.spyOn(ErrorCatchHelper, 'serviceCatch').mockImplementation((error) => error);

            await expect(service.getOwnCV('profileId')).rejects.toThrow('Error');
        });
    });

    describe('getCvByUserId', () => {
        it('should return a list of published CVs', async () => {
            const mockCvs = [{ cvId: '1' }];
            jest.spyOn(repository, 'find').mockResolvedValue(mockCvs as any);

            const result = await service.getCvByUserId('profileId');
            expect(result).toEqual(new CvResponseDtoBuilder().setValue(mockCvs).success().build());
            expect(repository.find).toHaveBeenCalledWith({
                where: { profile: { profileId: 'profileId' }, isPublished: true },
                relations: { profile: { account: true } },
                select: { profile: {} },
            });
        });
    });

    describe('uploadCV', () => {
        it('should create and save a new CV', async () => {
            const mockPayload = { cvName: 'CV1', cvUrl: 'url', size: 123, isPublished: true };
            const mockUser = { profileId: 'profileId' };
            const mockCv = { ...mockPayload, cvId: '1' };

            jest.spyOn(repository, 'create').mockReturnValue(mockCv as any);
            jest.spyOn(repository, 'save').mockResolvedValue(mockCv as any);

            const result = await service.uploadCV(mockPayload as any, mockUser as any);
            expect(result).toEqual(new CvResponseDtoBuilder().setValue(mockCv).success().build());
            expect(repository.create).toHaveBeenCalledWith({
                ...mockPayload,
                profile: { profileId: 'profileId' },
            });
            expect(repository.save).toHaveBeenCalledWith(mockCv);
        });
    });

    describe('updateCV', () => {
        it('should update an existing CV', async () => {
            const mockPayload = { cvName: 'Updated CV', isPublished: false };
            const mockUser = { profileId: 'profileId' };

            jest.spyOn(repository, 'exists').mockResolvedValue(true);
            jest.spyOn(repository, 'update').mockResolvedValue({ affected: 1 } as any);

            const result = await service.updateCV('cvId', mockPayload as any, mockUser as any);
            expect(result).toEqual(new CvResponseDtoBuilder().setValue({ affected: 1 }).success().build());
            expect(repository.exists).toHaveBeenCalledWith({
                where: { cvId: 'cvId', profile: { profileId: 'profileId' } },
            });
            expect(repository.update).toHaveBeenCalledWith(
                { cvId: 'cvId', profile: { profileId: 'profileId' } },
                mockPayload
            );
        });

        it('should throw NotFoundException if CV does not exist', async () => {
            jest.spyOn(repository, 'exists').mockResolvedValue(false);

            await expect(service.updateCV('cvId', {} as any, { profileId: 'profileId' } as any)).rejects.toThrow(
                NotFoundException
            );
        });
    });

    describe('deleteCV', () => {
        it('should delete an existing CV', async () => {
            const mockUser = { profileId: 'profileId' };

            jest.spyOn(repository, 'exists').mockResolvedValue(true);
            jest.spyOn(repository, 'delete').mockResolvedValue({ affected: 1 } as any);

            const result = await service.deleteCV('cvId', mockUser as any);
            expect(result).toEqual(new CvResponseDtoBuilder().setValue({ affected: 1 }).success().build());
            expect(repository.exists).toHaveBeenCalledWith({
                where: { cvId: 'cvId', profile: { profileId: 'profileId' } },
            });
            expect(repository.delete).toHaveBeenCalledWith({
                cvId: 'cvId',
                profile: { profileId: 'profileId' },
            });
        });

        it('should throw NotFoundException if CV does not exist', async () => {
            jest.spyOn(repository, 'exists').mockResolvedValue(false);

            await expect(service.deleteCV('cvId', { profileId: 'profileId' } as any)).rejects.toThrow(
                NotFoundException
            );
        });
    });
});
