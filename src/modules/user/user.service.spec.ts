import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './service/user.service';
import { ProfileRepository } from './repositories';
import { CreateUserDto } from './dtos';
import { UserResponseDtoBuilder } from './dtos';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserErrorType } from '@common/errors/user-error-type';
import { UserStatus } from '@database/entities/account.entity';
import { GenderType, ProfileEntity } from '@src/database/entities';
import { MaritalStatusType } from '@src/database/entities/profile.entity';
import { redisProviderName } from '@src/cache/cache.provider';
import { CategoryService } from '../category/services';

const mockProfileRepository = () => ({
    save: jest.fn(),
    findOne: jest.fn(),
});

const mockCategoryService = () => ({});

const mockCacheManager = () => ({});

describe('UserService', () => {
    let service: UserService;
    let profileRepository: jest.Mocked<ProfileRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: ProfileRepository, useFactory: mockProfileRepository },
                { provide: CategoryService, useFactory: mockCategoryService },
                { provide: redisProviderName, useFactory: mockCacheManager },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        profileRepository = module.get(ProfileRepository) as jest.Mocked<ProfileRepository>;
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createUser', () => {
        it('should return an error response when saving fails', async () => {
            const mockUser: CreateUserDto = {
                fullName: 'John Doe',
                introduction: 'Hello, I am John Doe',
                phone: '0123456789',
                education: 'University of Information Technology',
                experience: '2 years',
                account: 'account_id',
            };

            profileRepository.save.mockRejectedValue(new Error('Database error'));

            const result = await service.createUser(mockUser);

            expect(profileRepository.save).toHaveBeenCalled();
            expect(result).toEqual(
                new UserResponseDtoBuilder().setCode(400).setMessageCode('CREATE_USER_FAILED').build()
            );
        });
    });

    describe('getUserByProfileId', () => {
        it('should throw BadRequestException if profileId is not a valid UUID', async () => {
            const invalidProfileId = 'invalid-uuid';

            await expect(service.getUserByProfileId(invalidProfileId)).rejects.toThrow(BadRequestException);
            await expect(service.getUserByProfileId(invalidProfileId)).rejects.toThrow(
                UserErrorType.INVALID_PROFILE_ID
            );
        });

        it('should throw NotFoundException if profile is not found', async () => {
            const validProfileId = '550e8400-e29b-41d4-a716-446655440000';

            profileRepository.findOne.mockResolvedValue(null);

            await expect(service.getUserByProfileId(validProfileId)).rejects.toThrow(NotFoundException);
            await expect(service.getUserByProfileId(validProfileId)).rejects.toThrow(UserErrorType.USER_NOT_FOUND);
        });

        it('should return user profile if profile is found', async () => {
            const validProfileId = '550e8400-e29b-41d4-a716-446655440000';
            const mockProfile: ProfileEntity = {
                // Base entity fields
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true,

                // Profile required fields
                profileId: '550e8400-e29b-41d4-a716-446655440000',
                fullName: 'John Doe',

                // Profile fields with defaults
                profileUrl: process.env.AVATAR_IMAGE_URL || 'default-avatar-url',
                pageUrl: process.env.PAGE_IMAGE_URL || 'default-page-url',
                view: 0,
                isPremium: false,

                // Nullable fields
                introduction: 'Software Engineer with 5 years of experience',
                phone: '+84123456789',
                gender: GenderType.MALE,
                education: 'Bachelor of Computer Science',
                nationality: 'Vietnamese',
                dateOfBirth: new Date('1990-01-01'),
                maritalStatus: MaritalStatusType.ALONE,
                expiredPremium: null,
                experience: '5 years of full-stack development',

                // Entity relationships
                industry: null,
                majority: null,
                account: {
                    accountId: 'acc-550e8400-e29b-41d4-a716-446655440000',
                    status: UserStatus.ACTIVE,
                },

                // Relationship arrays
                websites: [],
                jobsRecently: [],
                jobs: [],
                userRatings: [],
                cvs: [],
                appliedJob: [],
                addresses: [],
            } as ProfileEntity;

            profileRepository.findOne.mockResolvedValue(mockProfile);

            const result = await service.getUserByProfileId(validProfileId);

            expect(result).toEqual(mockProfile);
        });
    });
});
