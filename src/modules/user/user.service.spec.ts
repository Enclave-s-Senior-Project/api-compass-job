import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './service/user.service';
import { ProfileRepository } from './repositories';
import { CreateUserDto } from './dtos';
import { UserResponseDtoBuilder } from './dtos';
import { GenderType } from '@database/entities';

const mockProfileRepository = () => ({
    save: jest.fn(), // Ensure it's explicitly mocked
});

describe('UserService', () => {
    let service: UserService;
    let profileRepository: jest.Mocked<ProfileRepository>; // Explicitly type it as a Jest mock

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UserService, { provide: ProfileRepository, useFactory: mockProfileRepository }],
        }).compile();

        service = module.get<UserService>(UserService);
        profileRepository = module.get(ProfileRepository) as jest.Mocked<ProfileRepository>; // Cast it explicitly
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
                isPremium: true,
                expiredPremium: new Date(),
                experience: '2 years',
                account: 'account_id',
            };

            // Fix: Explicitly cast and use mock function methods
            (profileRepository.save as jest.Mock).mockRejectedValue(new Error('Database error'));

            const result = await service.createUser(mockUser);

            expect(profileRepository.save).toHaveBeenCalled();
            expect(result).toEqual(
                new UserResponseDtoBuilder().setCode(400).setMessageCode('CREATE_USER_FAILED').build()
            );
        });
    });
});
