import { isUUID } from 'class-validator';
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
import { Like, Raw } from 'typeorm';
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
import { FilterCandidatesProfileDto } from '@src/modules/enterprise/dtos/filter-candidate.dto';
import { UpdateStatusUserDto } from '../dtos/update-status-user.dto';
import { WarningException } from '@src/common/http/exceptions/warning.exception';
import { AuthService } from '@src/modules/auth';
import { MailSenderService } from '@src/mail/mail.service';
import { FindCandidateDto } from '@src/common/dtos/find-candidate.dto';

type ProfileAndRoles = ProfileEntity & Pick<AccountEntity, 'roles'>;

@Injectable()
export class UserService {
    constructor(
        private readonly profileRepository: ProfileRepository,
        private readonly categoryService: CategoryService,
        private readonly websiteService: WebsiteService,
        private readonly cvService: CvService,
        private readonly mailService: MailSenderService,
        @Inject(redisProviderName) private readonly redisCache: RedisCommander,
        @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService
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
            // if (useCache) {
            //     const cachedProfile = await this.getProfileOnRedis(accountId);
            //     if (cachedProfile) return cachedProfile;
            // }

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
        if (!ValidationHelper.isValidateUUIDv4(profileId)) {
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

    public async getAllCandidate(
        options: FilterCandidatesProfileDto,
        user: JwtPayload,
        categories: string[]
    ): Promise<UserResponseDto> {
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

            if (!options.industryId && categories.length > 0 && categories.every((cat) => isUUID(cat))) {
                queryBuilder.andWhere('profile.industry_id IN (:...categories)', { categories });
            }
            if (options.industryId) {
                const categoriesArray = Array.isArray(options.industryId) ? options.industryId : [options.industryId];
                queryBuilder.andWhere('profile.industry_id IN (:...categoriesArray)', { categoriesArray });
            }

            if (options.gender) {
                queryBuilder.andWhere('profile.gender = :gender', { gender: options.gender });
            }

            if (options.isMarried) {
                queryBuilder.andWhere('profile.marital_status = :maritalStatus', {
                    maritalStatus: options.isMarried,
                });
            }

            const total = await queryBuilder.getCount();

            queryBuilder
                .skip(options.skip)
                .take(options.take)
                .addOrderBy('profile.view', 'DESC')
                .addOrderBy('profile.isPremium', 'DESC')
                .addOrderBy('profile.createdAt', options.order);

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

    public async getUserByProfileIdAndFavorite(profileId: string, enterpriseId: string) {
        if (!ValidationHelper.isValidateUUIDv4(profileId)) {
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
            const profileWithAppliedJob = await this.profileRepository
                .createQueryBuilder('profile')
                .leftJoin('profile.appliedJob', 'appliedJob')
                .leftJoin('appliedJob.job', 'job')
                .leftJoin('job.enterprise', 'enterprise')
                .where('profile.profileId = :profileId', { profileId })
                .andWhere('enterprise.enterpriseId = :enterpriseId', { enterpriseId })
                .select(['profile.profileId', 'appliedJob.coverLetter'])
                .getOne();
            const isFavorite =
                (await this.profileRepository
                    .createQueryBuilder('profile')
                    .innerJoin('profile.enterprises', 'enterprise')
                    .where('profile.profileId = :profileId', { profileId })
                    .andWhere('enterprise.enterpriseId = :enterpriseId', { enterpriseId })
                    .getCount()) > 0;
            const coverLetter =
                profileWithAppliedJob?.appliedJob?.length > 0 ? profileWithAppliedJob.appliedJob[0].coverLetter : null;

            return new UserResponseDtoBuilder()
                .setValue({
                    ...profileInfo,
                    isFavorite,
                    coverLetter,
                })
                .success()
                .build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async getProfileUserDashboard(userId: string) {
        try {
            const profile = await this.profileRepository.findOne({
                where: { profileId: userId },
                relations: ['appliedJob', 'appliedJob.job', 'jobs'],
            });
            if (!profile) {
                throw new NotFoundException(UserErrorType.USER_NOT_FOUND);
            }
            const totalAppliedJob = profile.appliedJob.length;
            const totalFavoriteJob = profile.jobs.length;
            const temp = {
                ...profile,
                appliedJob: profile.appliedJob.slice(0, 6),
                totalAppliedJob,
                totalFavoriteJob,
            };
            return new UserResponseDtoBuilder().setValue(temp).success().build();
        } catch (error) {
            console.error('Error in getInformationUser:', error);
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    // public async getAllCandidatesDashboard(options: PaginationDto): Promise<UserResponseDto> {
    //     try {
    //         const [profiles, total] = await this.profileRepository.findAndCount({
    //             skip: options.skip,
    //             take: options.take,
    //             where: {
    //                 account: {
    //                     roles: Raw((alias) => `'USER' = ANY(${alias})`),
    //                 },
    //             },
    //             relations: ['account'],
    //         });

    //         const meta = new PageMetaDto({
    //             pageOptionsDto: options,
    //             itemCount: total,
    //         });

    //         return new UserResponseDtoBuilder().setValue(new PageDto<ProfileEntity>(profiles, meta)).success().build();
    //     } catch (error) {
    //         console.error('Error fetching profiles:', error);
    //         return new UserResponseDtoBuilder().setCode(400).setMessageCode(UserErrorType.FETCH_USER_FAILED).build();
    //     }
    // }
    public async getAllCandidatesDashboard(queries: FindCandidateDto): Promise<UserResponseDto> {
        try {
            const queryBuilder = this.profileRepository
                .createQueryBuilder('profile')
                .leftJoinAndSelect('profile.account', 'account')
                .select([
                    'profile.profileId',
                    'profile.fullName',
                    'profile.profileUrl',
                    'profile.pageUrl',
                    'profile.introduction',
                    'profile.phone',
                    'profile.view',
                    'profile.gender',
                    'profile.education',
                    'profile.nationality',
                    'profile.dateOfBirth',
                    'profile.maritalStatus',
                    'profile.isPremium',
                    'profile.expiredPremium',
                    'profile.experience',
                    'profile.createdAt',
                    'account.accountId',
                    'account.email',
                    'account.roles',
                    'account.status',
                    'account.createdAt',
                    'account.updatedAt',
                ])
                .where(`'USER' = ANY(account.roles)`)
                .take(queries.take)
                .skip(queries.skip);

            if (queries.order) {
                queryBuilder.orderBy('profile.createdAt', queries.order);
            }

            if (queries.options) {
                queryBuilder.andWhere('(profile.fullName ILIKE :search OR account.email ILIKE :search)', {
                    search: `%${queries.options}%`,
                });
            }

            if (queries.status) {
                queryBuilder.andWhere('account.status = :status', { status: queries.status });
            }

            if (queries.gender) {
                queryBuilder.andWhere('profile.gender = :gender', {
                    gender: queries.gender,
                });
            }

            if (queries.maritalStatus) {
                queryBuilder.andWhere('profile.maritalStatus = :maritalStatus', {
                    maritalStatus: queries.maritalStatus,
                });
            }

            if (queries.nationality) {
                queryBuilder.andWhere('profile.nationality ILIKE :nationality', {
                    nationality: `%${queries.nationality}%`,
                });
            }

            const [profiles, total] = await queryBuilder.getManyAndCount();

            const meta = new PageMetaDto({
                pageOptionsDto: queries,
                itemCount: total,
            });

            return new UserResponseDtoBuilder().setValue(new PageDto<ProfileEntity>(profiles, meta)).success().build();
        } catch (error) {
            console.error('Error fetching profiles:', error);
            return new UserResponseDtoBuilder().setCode(400).setMessageCode(UserErrorType.FETCH_USER_FAILED).build();
        }
    }

    public async updateUserStatus(profileId: string, payload: UpdateStatusUserDto) {
        try {
            const profile = await this.profileRepository.findOne({
                where: { profileId: profileId },
                relations: ['account'],
            });

            if (!profile) {
                throw new NotFoundException(UserErrorType.USER_NOT_FOUND);
            }

            if (profile.account.status === payload.status) {
                throw new WarningException(UserErrorType.USER_ALREADY_EXISTS);
            }

            // update the status of the enterprise
            const temp = await this.authService.updateStatus(profile.account.accountId, payload.status);
            // Send email to the enterprise about the status change
            this.sendEmailEnterpriseStatusChange(profile, payload.status, payload.reason);

            return new UserResponseDtoBuilder().success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    private async sendEmailEnterpriseStatusChange(user: ProfileEntity, status: UserStatus, reason?: string) {
        try {
            // Send email to the enterprise account
            const emails = [];

            if (user.account.email) emails.push(user.account.email);

            if (emails.length > 0) {
                this.mailService.sendUserStatusMail(emails, user.fullName, status, reason);
            }
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
