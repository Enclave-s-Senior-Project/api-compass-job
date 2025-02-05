import { Injectable } from '@nestjs/common';
import { ProfileRepository } from '../repositories';
import { CreateUserDto, UserResponseDtoBuilder } from '../dtos';
import { GenderType, ProfileEntity } from '@database/entities';
import { UserResponseDto } from '@modules/admin/access/users/dtos';
@Injectable()
export class UserService {
    constructor(private readonly profileRepository: ProfileRepository) {}

    /**
     * Create default user
     * @param CreateUserDto {CreateUserDto}
     * @returns {Promise<UserResponseDto>}
     */
    public async createUser(user: CreateUserDto) {
        try {
            const profile: ProfileEntity = await this.profileRepository.save({
                fullName: user.fullName,
                avatarUrl: process.env.AVATAR_IMAGE_URL || '', // Use env default
                pageUrl: process.env.PAGE_IMAGE_URL || '',
                introduction: user.introduction || null,
                phone: user.phone || null,
                view: 0,
                gender: GenderType.MALE,
                education: user.education || null,
                isPremium: user.isPremium ?? false,
                expiredPremium: user.expiredPremium || null,
                experience: user.experience || null,
                isActive: false,
                account_id: user.account,
            });

            return new UserResponseDtoBuilder()
                .setCode(201)
                .setMessageCode('CREATE_USER_SUCCESS')
                .setValue(profile)
                .build();
        } catch (error) {
            console.error('Error creating user:', error);
            return new UserResponseDtoBuilder().setCode(400).setMessageCode('CREATE_USER_FAILED').build();
        }
    }
}
