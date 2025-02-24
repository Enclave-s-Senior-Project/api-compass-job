import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProfileRepository } from '../repositories';
import { CreateUserDto, UserResponseDtoBuilder } from '../dtos';
import { GenderType, ProfileEntity } from '@database/entities';
import { RedisCommander } from 'ioredis';
import { UserResponseDto } from '../dtos/user-response.dto';
import { JwtPayload, PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { UserErrorType } from '@common/errors/user-error-type';
import { Like } from 'typeorm';
import { ImagekitService } from '@imagekit/imagekit.service';
import { UpdatePersonalProfileDto } from '@modules/user/dtos/update-personal-profile.dto';
import { redisProviderName } from '@cache/cache.provider';
const sharp = require('sharp');

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
    public async getUserByAccountId(accountId: string): Promise<ProfileEntity | null> {
        const cacheKey = `account:${accountId}`;

        try {
            const cachedProfile = await this.redisCache.get(cacheKey);
            if (cachedProfile) {
                return JSON.parse(cachedProfile) as ProfileEntity;
            }
            const profile = await this.profileRepository.findOne({ where: { account_id: accountId } });
            if (!profile) return null;

            this.redisCache.setex(cacheKey, 600, JSON.stringify(profile));
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
            const profile = await this.profileRepository.findOne({ where: { profileId: id } });

            if (!profile) {
                throw new NotFoundException('USER_NOT_FOUND');
            }

            const isOwner = currentUser.accountId === profile.account_id;
            const isAdmin = currentUser.roles.includes('ADMIN');

            if (!isOwner && !isAdmin) {
                throw new ForbiddenException('FORBIDDEN');
            }
            const updatedProfile = await this.profileRepository.save({
                ...profile,
                ...newUser,
                account: { id: currentUser.accountId } as any,
            });

            await this.setProfileOnRedis(updatedProfile);
            return new UserResponseDtoBuilder().setCode(200).setValue(updatedProfile).success().build();
        } catch (error) {
            console.error('Error updating user:', error);
            if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error;
            }
            throw new BadRequestException('UPDATE_USER_FAILED');
        }
    }
    private async setProfileOnRedis(profile: ProfileEntity) {
        await this.redisCache.set(`profile:${profile.profileId}`, JSON.stringify(profile), 'EX', 432000);
    }
    private async getProfileOnRedis(profileId) {
        return JSON.parse(await this.redisCache.get(`profile:${profileId}`));
    }

    public async updatePersonalProfile(
        files: { avatar: Express.Multer.File[]; background: Express.Multer.File[] },
        body: UpdatePersonalProfileDto,
        user: JwtPayload
    ) {
        try {
            const profile = await this.profileRepository.findOne({
                where: { profileId: user.profileId, account: { accountId: user.accountId } },
            });
            if (!profile) {
                throw new NotFoundException(UserErrorType.USER_NOT_FOUND);
            }

            const uploadPromises = [];

            if (files?.avatar) {
                const avatarPromise = (async (): Promise<string> => {
                    const compressBuffer = await sharp(files.avatar[0].buffer)
                        .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
                        .webp({ quality: 80 })
                        .toBuffer();

                    const response = await this.imagekitService.uploadAvatarImage({
                        file: compressBuffer,
                        fileName: `avatar_${Date.now()}`,
                    });
                    return response.url;
                })();

                uploadPromises.push(avatarPromise);
            }

            if (files?.background) {
                const avatarPromise = (async (): Promise<string> => {
                    const compressBuffer = await sharp(files.background[0].buffer)
                        .resize({ width: 1280, height: 768, fit: 'inside', withoutEnlargement: true })
                        .webp({ quality: 80 })
                        .toBuffer();

                    const response = await this.imagekitService.uploadPageImage({
                        file: compressBuffer,
                        fileName: `background_${Date.now()}`,
                    });
                    return response.url;
                })();

                uploadPromises.push(avatarPromise);
            }

            const [avatarUrl, backgroundUrl] = await Promise.all(uploadPromises);

            const updatedProfile = await this.profileRepository.save({
                ...profile,
                profileUrl: avatarUrl ?? profile.profileUrl,
                pageUrl: backgroundUrl ?? profile.pageUrl,
                education: body.education,
                experience: body.experience,
                phone: body.phone,
            });

            this.setProfileOnRedis(updatedProfile);

            return new UserResponseDtoBuilder().setValue(updatedProfile).success().build();
        } catch (error) {
            return new UserResponseDtoBuilder().internalServerError().build();
        }
    }
}
