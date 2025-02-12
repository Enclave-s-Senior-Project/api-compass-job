import { Inject, Injectable } from '@nestjs/common';
import { ProfileRepository } from '../repositories';
import { CreateUserDto, UserResponseDtoBuilder } from '../dtos';
import { GenderType, ProfileEntity } from '@database/entities';
import { RedisCommander } from 'ioredis';
import { UserResponseDto } from '../dtos/user-response.dto';
import { PageDto, PageMetaDto, PaginationDto } from 'src/common/dtos';
import { UserErrorType } from '@common/errors/user-error-type';
import { ProfileFilterDto } from '../dtos/user-filter-dto';

@Injectable()
export class UserService {
    constructor(
        private readonly profileRepository: ProfileRepository,
        @Inject('CACHE_INSTANCE') private readonly redisCache: RedisCommander
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
                isPremium: user.isPremium ?? false,
                expiredPremium: user.expiredPremium ?? null,
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
    public async getUserByAccountId(accountId: string): Promise<ProfileEntity | null> {
        const cacheKey = `profile:${accountId}`;

        try {
            const cachedProfile = await this.redisCache.get(cacheKey);
            if (cachedProfile) {
                return JSON.parse(cachedProfile) as ProfileEntity;
            }

            const profile = await this.profileRepository.findOne({ where: { account_id: accountId } });
            if (!profile) return null;

            await this.redisCache.setex(cacheKey, 600, JSON.stringify(profile));
            return profile;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    }
    public async findUserByAccountId(accountId: string): Promise<ProfileEntity | null> {
        try {
            return this.profileRepository.findOne({ where: { account_id: accountId } });
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

    public async filterUsers(options: PaginationDto, query: ProfileFilterDto): Promise<UserResponseDto> {
        try {
            console.log('options service', options);
            console.log('query servicet', query);
            const [profiles, total] = await this.profileRepository.findAndCount({
                skip: options.skip,
                take: options.take,
                where: query,
            });

            const meta = new PageMetaDto({
                pageOptionsDto: options,
                itemCount: total,
            });

            return new UserResponseDtoBuilder().setValue(new PageDto<ProfileEntity>(profiles, meta)).success().build();
        } catch (error) {
            return new UserResponseDtoBuilder().setCode(400).setMessageCode(UserErrorType.FETCH_USER_FAILED).build();
        }
    }
}
