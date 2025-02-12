import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './service/user.service';
import { PaginationDto } from '@common/dtos';
import { UserResponseDto, UserResponseDtoBuilder } from './dtos/user-response.dto';

describe('UserController', () => {
    let userController: UserController;
    let userService: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                {
                    provide: UserService,
                    useValue: {
                        getAllUsers: jest.fn(),
                        filterUsers: jest.fn(),
                    },
                },
            ],
        }).compile();

        userController = module.get<UserController>(UserController);
        userService = module.get<UserService>(UserService);
    });

    it('should be defined', () => {
        expect(userController).toBeDefined();
    });

    describe('getAllUsers', () => {
        it('should return all users', async () => {
            const mockResponse = new UserResponseDtoBuilder().setCode(200).setMessageCode('SUCCESS').build();
            jest.spyOn(userService, 'getAllUsers').mockResolvedValue(mockResponse);

            const pageOptions: PaginationDto = { skip: 0, take: 10 };
            const result = await userController.getAllUsers(pageOptions);

            expect(result).toBe(mockResponse);
            expect(userService.getAllUsers).toHaveBeenCalledWith(pageOptions);
        });
    });

    describe('filterUsers', () => {
        it('should return filtered users', async () => {
            const mockResponse = new UserResponseDtoBuilder().setCode(200).setMessageCode('SUCCESS').build();
            jest.spyOn(userService, 'filterUsers').mockResolvedValue(mockResponse);

            const pageOptions: PaginationDto = { skip: 0, take: 10 };
            const query = { fullName: 'John' };
            const result = await userController.filterUsers(pageOptions, query);

            expect(result).toBe(mockResponse);
            expect(userService.filterUsers).toHaveBeenCalledWith(pageOptions, query);
        });
    });

    describe('UserResponseDtoBuilder', () => {
        it('should create a UserResponseDto with correct values', () => {
            const response = new UserResponseDtoBuilder().setCode(200).setMessageCode('TEST_SUCCESS').build();
            expect(response).toBeInstanceOf(UserResponseDto);
            expect(response.code).toBe(200);
            expect(response.message_code).toBe('TEST_SUCCESS');
        });
    });
});
