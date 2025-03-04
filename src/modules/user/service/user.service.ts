import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProfileRepository } from '../repositories';
import { CreateUserDto, UserResponseDtoBuilder } from '../dtos';
import { AccountEntity, GenderType, ProfileEntity } from '@database/entities';
import { RedisCommander } from 'ioredis';
import { UserResponseDto } from '../dtos/user-response.dto';
import { JwtPayload, PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { UserErrorType } from '@common/errors/user-error-type';
import { Like } from 'typeorm';
import { ImagekitService } from '@imagekit/imagekit.service';
import { UpdatePersonalProfileDto } from '@modules/user/dtos/update-personal-profile.dto';
import { redisProviderName } from '@cache/cache.provider';
import { UserStatus } from '@database/entities/account.entity';
import { UpdateCandidateProfileDto } from '../dtos/update-candidate-profile.dto';

type ProfileAndRoles = ProfileEntity & Pick<AccountEntity, 'roles'>;

@Injectable()
export class UserService {
    constructor(
        private readonly profileRepository: ProfileRepository,
        private readonly imagekitService: ImagekitService,
        @Inject(redisProviderName) private readonly redisCache: RedisCommander
    ) {}

    /**
     * Create default user
     * @param user {CreateUserDto}
     * @returns {Promise<UserResponseDto>}
     */
    public async createUser(user: CreateUserDto): Promise<UserResponseDto> {
        try {
            const profile = await this.profileRepository.save({
                fullName: user.fullName,
                avatarUrl: process.env.AVATAR_IMAGE_URL || '',
                pageUrl: process.env.PAGE_IMAGE_URL || '',
                introduction: user.introduction ?? null,
                phone: user.phone ?? null,
                view: 0,
                gender: user.gender ?? GenderType.MALE,
                education: user.education ?? null,
                experience: user.experience ?? null,
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

    /**
     * Activate user profile
     * @param accountId {string}
     * @returns {Promise<ProfileEntity | null>}
     */
    public async activeProfile(accountId: string): Promise<ProfileEntity | null> {
        try {
            const profile = await this.profileRepository.findOne({ where: { account_id: accountId } });
            if (!profile) return null;

            profile.isActive = true;
            await this.profileRepository.save(profile);

            return profile;
        } catch (error) {
            console.error('Error activating profile:', error);
            return null;
        }
    }

    /**
     * Get user profile by account ID with caching
     * @param accountId {string}
     * @returns {Promise<ProfileEntity | null>}
     */
    public async getUserByAccountId(accountId: string): Promise<ProfileAndRoles> | null {
        try {
            const cachedProfile = await this.getProfileOnRedis(accountId);
            if (cachedProfile) return cachedProfile;

            const profile = await this.profileRepository.findOne({
                where: { account_id: accountId },
                relations: { account: true },
                select: {
                    account: {
                        roles: true,
                    },
                },
            });
            if (!profile) return null;

            const result = { ...profile, roles: profile.account.roles };
            delete result.account;

            this.setProfileOnRedis(accountId, result);
            return result;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    }

    public async countUsers(): Promise<number> {
        return this.profileRepository.count();
    }

    public async getAllUsers(options: PaginationDto): Promise<UserResponseDto> {
        try {
            const [profiles, total] = await this.profileRepository.findAndCount({
                skip: options.skip,
                take: options.take,
            });

            const meta = new PageMetaDto({
                pageOptionsDto: options,
                itemCount: total,
            });

            return new UserResponseDtoBuilder().setValue(new PageDto<ProfileEntity>(profiles, meta)).success().build();
        } catch (error) {
            console.error('Error fetching profiles:', error);
            return new UserResponseDtoBuilder().setCode(400).setMessageCode(UserErrorType.FETCH_USER_FAILED).build();
        }
    }

    public async filterUsers(options: PaginationDto): Promise<UserResponseDto> {
        try {
            let filterOptions: Record<string, any> = {};
            if (options.options) {
                try {
                    filterOptions = JSON.parse(`{${options.options}}`);
                } catch (error) {
                    console.error('Invalid JSON in options:', error);
                }
            }

            const where: Record<string, any> = {};

            if (filterOptions.fullName) {
                where.fullName = Like(`%${filterOptions.fullName}%`);
            }

            if (filterOptions.phone) {
                where.phone = Like(`%${filterOptions.phone}%`);
            }

            if (filterOptions.gender) {
                where.gender = filterOptions.gender;
            }

            if (filterOptions.isPremium !== undefined) {
                where.isPremium = filterOptions.isPremium;
            }

            const [profiles, total] = await this.profileRepository.findAndCount({
                skip: options.skip,
                take: options.take,
                where,
            });

            const meta = new PageMetaDto({
                pageOptionsDto: options,
                itemCount: total,
            });

            return new UserResponseDtoBuilder().setValue(new PageDto<ProfileEntity>(profiles, meta)).success().build();
        } catch (error) {
            console.error('Error in filterUsers:', error);
            return new UserResponseDtoBuilder().setCode(400).setMessageCode(UserErrorType.FETCH_USER_FAILED).build();
        }
    }

    public async updateUser(
        currentUser: JwtPayload,
        id: string,
        newUser: Partial<CreateUserDto>
    ): Promise<UserResponseDto> {
        try {
            const profile = await this.profileRepository.findOne({
                where: { profileId: id },
                relations: { account: true },
                select: {
                    account: {
                        roles: true,
                        accountId: true,
                    },
                },
            });

            if (!profile) {
                throw new NotFoundException('USER_NOT_FOUND');
            }

            const isOwner = currentUser.accountId === profile.account_id;
            const isAdmin = currentUser.roles.includes('ADMIN');

            if (!isOwner && !isAdmin) {
                throw new ForbiddenException('FORBIDDEN');
            }

            const { account, ...profileWithoutRoles } = profile;

            const updatedProfile = await this.profileRepository.save({
                ...profileWithoutRoles,
                fullName: newUser.fullName,
                introduction: newUser.introduction,
                phone: newUser.phone,
                gender: newUser.gender,
                education: newUser.education,
                experience: newUser.experience,
                email: newUser.email,
            });

            const result: ProfileAndRoles = { ...(updatedProfile as ProfileEntity), roles: account.roles };

            await this.setProfileOnRedis(account.accountId, result);
            return new UserResponseDtoBuilder().setCode(200).setValue(updatedProfile).success().build();
        } catch (error) {
            console.error('Error updating user:', error);
            if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error;
            }
            throw new BadRequestException('UPDATE_USER_FAILED');
        }
    }
    private async setProfileOnRedis(accountId: string, payload: ProfileAndRoles) {
        await this.redisCache.set(`user-information:${accountId}`, JSON.stringify(payload), 'EX', 432000);
    }
    private async getProfileOnRedis(accountId: string) {
        return JSON.parse(await this.redisCache.get(`user-information:${accountId}`));
    }

    public async updatePersonalProfile(payload: UpdatePersonalProfileDto, user: JwtPayload) {
        try {
            const profile = await this.profileRepository.findOne({
                where: { profileId: user.profileId, account: { accountId: user.accountId, status: UserStatus.ACTIVE } },
            });
            if (!profile) {
                throw new NotFoundException(UserErrorType.USER_NOT_FOUND);
            }

            const updatedProfile = await this.profileRepository.save({
                ...profile,
                profileUrl: payload.profileUrl,
                pageUrl: payload.pageUrl,
                education: payload.education,
                experience: payload.experience,
                phone: payload.phone,
                fullName: payload.fullName,
            });

            const finalResult = { ...updatedProfile, roles: user.roles };

            this.setProfileOnRedis(user.accountId, finalResult);

            return new UserResponseDtoBuilder().setValue(finalResult).success().build();
        } catch (error) {
            return new UserResponseDtoBuilder().internalServerError().build();
        }
    }

    public async updateCandidateProfile(payload: UpdateCandidateProfileDto, user: JwtPayload) {
        try {
            const profile = await this.profileRepository.findOne({
                where: { profileId: user.profileId, account: { accountId: user.accountId, status: UserStatus.ACTIVE } },
            });
            if (!profile) {
                throw new NotFoundException(UserErrorType.USER_NOT_FOUND);
            }
            const updatedProfile = await this.profileRepository.save({
                ...profile,
                nationality: payload.nationality,
                maritalStatus: payload.maritalStatus,
                gender: payload.gender,
                dateOfBirth: payload.dateOfBirth,
                introduction: payload.introduction,
            });

            const finalResult = { ...updatedProfile, roles: user.roles };

            this.setProfileOnRedis(user.accountId, finalResult);

            return new UserResponseDtoBuilder().setValue(finalResult).success().build();
        } catch (error) {
            return new UserResponseDtoBuilder().internalServerError().build();
        }
    }
}
