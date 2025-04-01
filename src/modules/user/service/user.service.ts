import {
    BadRequestException,
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ProfileRepository } from '../repositories';
import { CreateUserDto, UserResponseDtoBuilder } from '../dtos';
import { AccountEntity, GenderType, ProfileEntity } from '@database/entities';
import { RedisCommander } from 'ioredis';
import { UserResponseDto } from '../dtos/user-response.dto';
import { JwtPayload, PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { UserErrorType } from '@common/errors/user-error-type';
import { Like } from 'typeorm';
import { UpdatePersonalProfileDto } from '@modules/user/dtos/update-personal-profile.dto';
import { redisProviderName } from '@cache/cache.provider';
import { UserStatus } from '@database/entities/account.entity';
import { UpdateCandidateProfileDto } from '../dtos/update-candidate-profile.dto';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import { CategoryService } from '@modules/category/services';
import { ValidationHelper } from '@src/helpers/validation.helper';
import { GlobalErrorType } from '@src/common/errors/global-error';
import { WebsiteService } from '@src/modules/website/services';
import { CvService } from '@src/modules/cv/services/cv.service';
import { ApplyJobService } from '@src/modules/apply-job/services/apply-job.service';
import { FilterCandidatesProfileDto } from '@src/modules/enterprise/dtos/filter-candidate.dto';

type ProfileAndRoles = ProfileEntity & Pick<AccountEntity, 'roles'>;

@Injectable()
export class UserService {
    constructor(
        private readonly profileRepository: ProfileRepository,
        private readonly categoryService: CategoryService,
        private readonly websiteService: WebsiteService,
        private readonly cvService: CvService,
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
                profileUrl: user.profileUrl ?? process.env.AVATAR_IMAGE_URL ?? '',
                pageUrl: process.env.PAGE_IMAGE_URL || '',
                introduction: user.introduction ?? null,
                phone: user.phone ?? null,
                view: 0,
                gender: user.gender ?? GenderType.MALE,
                education: user.education ?? null,
                experience: user.experience ?? null,
                isActive: false,
                account: {
                    accountId: user.account,
                },
            });

            return new UserResponseDtoBuilder()
                .setCode(201)
                .setMessageCode('CREATE_USER_SUCCESS')
                .setValue(profile)
                .build();
        } catch (error) {
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
            const profile = await this.profileRepository.findOne({
                where: {
                    account: {
                        accountId: accountId,
                    },
                },
            });
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
    public async getUserByAccountId(accountId: string, useCache: boolean = true): Promise<ProfileAndRoles> | null {
        try {
            if (useCache) {
                const cachedProfile = await this.getProfileOnRedis(accountId);
                if (cachedProfile) return cachedProfile;
            }

            const profile = await this.profileRepository.findOne({
                where: { account: { accountId: accountId } },
                relations: { account: true, industry: true, majority: true },
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

            const isOwner = currentUser.accountId === profile.account.accountId;
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

            await this.profileRepository.save({
                ...profile,
                profileUrl: payload.profileUrl,
                pageUrl: payload.pageUrl,
                education: payload.education,
                experience: payload.experience,
                phone: payload.phone,
                maritalStatus: payload.maritalStatus,
                dateOfBirth: payload.dateOfBirth,
                fullName: payload.fullName,
            });

            const updatedProfile = await this.getUserByAccountId(user.accountId, false);

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

            if (payload.majorityId && !payload.industryId) {
                throw new BadRequestException(UserErrorType.FILL_INDUSTRY_BEFORE_MAJORITY);
            }

            if (payload.industryId && payload.majorityId) {
                const isValidRelationship = await this.categoryService.checkFamilyCategory(
                    payload.industryId,
                    payload.majorityId
                );

                if (!isValidRelationship) {
                    throw new BadRequestException(UserErrorType.MAJORITY_MUST_BE_CHILD_OF_INDUSTRY);
                }
            }

            await this.profileRepository.update(profile.profileId, {
                ...profile,
                nationality: payload?.nationality || null,
                gender: payload?.gender || null,
                industry: payload?.industryId ? { categoryId: payload?.industryId } : null,
                majority: payload?.majorityId ? { categoryId: payload?.majorityId } : null,
                introduction: payload?.introduction || '',
            });

            const updatedProfile = await this.getUserByAccountId(user.accountId, false);

            const finalResult = { ...updatedProfile, roles: user.roles };

            this.setProfileOnRedis(user.accountId, finalResult);

            return new UserResponseDtoBuilder().setValue(finalResult).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async checkProfile(id: string): Promise<ProfileEntity> {
        return this.profileRepository.findOne({ where: { profileId: id } });
    }

    public async getUserByProfileId(profileId: string) {
        
        if (ValidationHelper.isValidateUUIDv4(profileId)) {
            throw new BadRequestException(GlobalErrorType.INVALID_ID);
        }

        try {
            const profile = await this.profileRepository.findOne({
                where: { profileId: profileId, account: { status: UserStatus.ACTIVE } },
                relations: ['account'],
                select: {
                    account: {
                        accountId: true,
                    },
                },
            });
            if (!profile?.account?.accountId) {
                throw new NotFoundException(UserErrorType.USER_NOT_FOUND);
            }
            const profileInfo = await this.getUserByAccountId(profile.account.accountId, true);
            return new UserResponseDtoBuilder().setValue(profileInfo).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
    protected async getFilterResultOnCache(key: string): Promise<ProfileEntity[] | null> {
        const cacheResult = await this.redisCache.get(`candidateFilter:${key}`);
        return JSON.parse(cacheResult) || null;
    }

    protected async storeFilterResultOnCache(key: string, results: ProfileEntity[]) {
        const cacheKey = `candidateFilter:${key}`;
        await this.redisCache.set(cacheKey, JSON.stringify(results), 'EX', 60 * 60 * 24);
    }

    public async getAllCandidate(options: FilterCandidatesProfileDto, user: JwtPayload): Promise<UserResponseDto> {
        try {
            const queryBuilder = this.profileRepository
                .createQueryBuilder('profile')
                .leftJoinAndSelect('profile.account', 'account')
                .leftJoin(
                    'candidate_favorites',
                    'cf',
                    'cf.profile_id = profile.profile_id AND cf.enterprise_id = :enterpriseId',
                    { enterpriseId: user.enterpriseId }
                )
                .addSelect('CASE WHEN cf.profile_id IS NOT NULL THEN true ELSE false END', 'is_favorite');

            if (options.gender) {
                queryBuilder.andWhere('profile.gender = :gender', { gender: options.gender });
            }
            if (options.isMaried) {
                queryBuilder.andWhere('profile.marital_status = :maritalStatus', {
                    maritalStatus: options.isMaried,
                });
            }
            if (options.industryId) {
                const categoriesArray = Array.isArray(options.industryId) ? options.industryId : [options.industryId];
                queryBuilder.andWhere('profile.industry_id IN (:...categoriesArray)', { categoriesArray });
            }

            const total = await queryBuilder.getCount();

            queryBuilder.skip(options.skip).take(options.take);

            const { entities, raw } = await queryBuilder.getRawAndEntities();

            const profilesWithFavorite = entities.map((profile, index) => {
                return {
                    ...profile,
                    is_favorite: raw[index].is_favorite || false,
                };
            });

            const meta = new PageMetaDto({
                pageOptionsDto: options,
                itemCount: total,
            });

            return new UserResponseDtoBuilder()
                .setValue(new PageDto<ProfileEntity>(profilesWithFavorite, meta))
                .success()
                .build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async findByProfileId(profileId: string) {
        return this.websiteService.findByProfileId(profileId);
    }

    public async getCvByUserId(profileId: string) {
        return this.cvService.getCvByUserId(profileId);
    }
}
