import { BadRequestException, forwardRef, HttpException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EnterpriseRepository } from '../repositories';
import { CreateEnterpriseDto } from '../dtos/create-enterprise.dto';
import { UpdateEnterpriseDto } from '../dtos/update-enterprise.dto';
import {
    EnterpriseResponseDto,
    EnterpriseResponseDtoBuilder,
    RegisterPremiumEnterpriseDto,
    UpdateCompanyAddressDto,
} from '../dtos';
import { JwtPayload, PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { EnterpriseErrorType } from '@common/errors/enterprises-error-type';
import { UpdateCompanyInfoDto } from '../dtos/update-company-info.dto';
import { EnterpriseEntity } from '@database/entities';
import { redisProviderName } from '@cache/cache.provider';
import { RedisCommander } from 'ioredis';
import { EnterpriseStatus } from '@common/enums';
import { UpdateFoundingInfoDto } from '../dtos/update-founding-dto';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import { JobResponseDtoBuilder } from '@modules/job/dtos';
import { JobService } from '@modules/job/service/job.service';
import { CreateCandidateWishListDto } from '../dtos/create-candidate-wishlist.dto';
import { UserService } from '@src/modules/user/service';
import { ProfileErrorType } from '@src/common/errors/profile-error-type';
import { FilterCandidatesProfileDto } from '../dtos/filter-candidate.dto';
import { FindJobsByEnterpriseDto } from '../dtos/find-job-by-enterprise.dto';
import { AddressService } from '@src/modules/address/service/address.service';
import { CategoryService } from '@src/modules/category/services';
import { CacheService } from '@src/cache/cache.service';
import { AuthService } from '@src/modules/auth';
import { NotificationService } from '@src/modules/notification/notification.service';
import { NotificationType } from '@src/database/entities/notification.entity';
import { MailSenderService } from '@src/mail/mail.service';
import { WarningException } from '@src/common/http/exceptions/warning.exception';
import { UpdateStatusEnterpriseDto } from '../dtos/update-status-enterprise.dto';
import { ILike, IsNull, Not, TreeLevelColumn } from 'typeorm';
import { FindAllDto } from '../dtos/find-all.dto';
import { Role } from '@src/modules/auth/decorators/roles.decorator';
import { EmbeddingService } from '@src/modules/embedding/embedding.service';

@Injectable()
export class EnterpriseService {
    constructor(
        @Inject(forwardRef(() => JobService)) private readonly jobService: JobService,
        @Inject(forwardRef(() => CategoryService)) private readonly categoriesService: CategoryService,
        @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
        private readonly profileService: UserService,
        private readonly enterpriseRepository: EnterpriseRepository,
        private readonly addressService: AddressService,
        private readonly cacheService: CacheService,
        private readonly notificationService: NotificationService,
        private readonly mailService: MailSenderService,
        @Inject(forwardRef(() => EmbeddingService))
        private readonly embeddingService: EmbeddingService
    ) {}

    async create(createEnterpriseDto: CreateEnterpriseDto, user: JwtPayload): Promise<EnterpriseResponseDto> {
        try {
            const isEnterprises = await this.enterpriseRepository.findOne({
                where: { account: { accountId: user.accountId } },
            });
            if (isEnterprises) {
                throw new BadRequestException(EnterpriseErrorType.ENTERPRISE_ALREADY_EXISTS);
            }
            const mailEnterpriseExist = await this.enterpriseRepository.findOne({
                where: { email: createEnterpriseDto.email },
            });
            const checkEmailAccount = await this.authService.checkEmail(createEnterpriseDto.email, user.accountId);
            if (mailEnterpriseExist || checkEmailAccount) {
                throw new BadRequestException(EnterpriseErrorType.EMAIL_ALREADY_EXISTS);
            }
            const enterprise = this.enterpriseRepository.create({
                ...createEnterpriseDto,
                account: { accountId: user.accountId },
            });
            await this.enterpriseRepository.save(enterprise);

            // create embedding
            await this.embeddingService.createEnterpriseEmbedding(enterprise.enterpriseId);

            return new EnterpriseResponseDtoBuilder().setValue(enterprise).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getMe(enterpriseId: string) {
        try {
            const cache = await this.cacheService.getEnterpriseInfo(enterpriseId);
            if (cache) {
                return new EnterpriseResponseDtoBuilder().setValue(cache).build();
            }

            const enterprise = await this.enterpriseRepository.findOne({
                where: { enterpriseId: enterpriseId },
                relations: {
                    addresses: true,
                },
            });

            const categories = await this.categoriesService.findByIds(enterprise.categories);

            const enterpriseWithCategories = {
                ...enterprise,
                categories: categories,
            };

            this.cacheService.cacheEnterpriseInfo(enterpriseId, enterpriseWithCategories);

            return new EnterpriseResponseDtoBuilder().setValue(enterpriseWithCategories).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async findAddressesByEnterpriseId(enterpriseId: string) {
        try {
            const enterprise = await this.enterpriseRepository.findOne({
                where: { enterpriseId },
                relations: ['addresses'],
                select: {
                    enterpriseId: true,
                    addresses: true,
                },
            });

            if (!enterprise) {
                throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_NOT_FOUND);
            }

            return new EnterpriseResponseDtoBuilder().setValue(enterprise).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getEnterpriseByAccountId(accountId: string) {
        try {
            const enterprise = await this.enterpriseRepository.findOne({
                where: { account: { accountId } },
                relations: {
                    addresses: true,
                },
                select: {
                    boostedJobs: false,
                    totalPoints: false,
                    addresses: {
                        addressId: true,
                        city: true,
                        country: true,
                        street: true,
                        zipCode: true,
                        mixedAddress: true,
                    },
                },
            });
            const categories = await this.categoriesService.findByIds(enterprise.categories);

            (enterprise as any).categories = categories;

            return new EnterpriseResponseDtoBuilder().setValue(enterprise).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async findAll(queries: FindAllDto) {
        try {
            const queryBuilder = this.enterpriseRepository
                .createQueryBuilder('enterprise')
                .leftJoinAndSelect('enterprise.addresses', 'addresses')
                .select([
                    'enterprise.enterpriseId',
                    'enterprise.name',
                    'enterprise.categories',
                    'enterprise.status',
                    'enterprise.email',
                    'enterprise.phone',
                    'enterprise.teamSize',
                    'enterprise.organizationType',
                    'enterprise.foundedIn',
                    'enterprise.isPremium',
                    'enterprise.logoUrl',
                    'enterprise.createdAt',
                    'enterprise.updatedAt',
                    'addresses.addressId',
                    'addresses.country',
                    'addresses.city',
                    'addresses.street',
                    'addresses.zipCode',
                    'addresses.mixedAddress',
                ])
                .take(queries.take)
                .skip(queries.skip)
                .orderBy('enterprise.createdAt', 'DESC');

            if (queries.options) {
                queryBuilder.andWhere('enterprise.name ILIKE :name', { name: `${queries.options}%` });
            }

            if (queries.status && queries.status !== EnterpriseStatus.PENDING) {
                queryBuilder.andWhere('enterprise.status = :status', { status: queries.status });
            } else {
                queryBuilder.andWhere('enterprise.status != :status', { status: EnterpriseStatus.PENDING });
            }

            if (queries.organizationType) {
                queryBuilder.andWhere('enterprise.organizationType = :organizationType', {
                    organizationType: queries.organizationType,
                });
            }

            if (queries.categoryId) {
                queryBuilder.andWhere(':categoryId = ANY(enterprise.categories)', {
                    categoryId: queries.categoryId,
                });
            }

            if (queries.address) {
                queryBuilder.andWhere('addresses.mixedAddress ILIKE :address', { address: `%${queries.address}%` });
            }

            const [profiles, total] = await queryBuilder.getManyAndCount();

            let enterprisesWithCategories = [];

            if (profiles?.length > 0) enterprisesWithCategories = await this.getCategoriesOfEnterprises(profiles);

            const meta = new PageMetaDto({
                pageOptionsDto: queries,
                itemCount: total,
            });
            return new EnterpriseResponseDtoBuilder()
                .setValue(new PageDto<any>(enterprisesWithCategories, meta))
                .build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async findOne(id: string) {
        try {
            const enterprise = await this.enterpriseRepository.findOne({
                where: { enterpriseId: id },
                relations: ['account', 'websites', 'jobs', 'addresses'],
            });

            if (!enterprise) {
                throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_ALREADY_EXISTS);
            }

            return enterprise;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    // Overloaded update method signatures
    public update(id: string, payload: UpdateEnterpriseDto): Promise<EnterpriseEntity>;
    public update(enterprise: EnterpriseEntity, payload: UpdateEnterpriseDto): Promise<EnterpriseEntity>;

    public async update(
        arg1: string | EnterpriseEntity,
        payload: UpdateCompanyInfoDto | UpdateFoundingInfoDto
    ): Promise<EnterpriseEntity> {
        try {
            let result = null;
            if (typeof arg1 === 'string') {
                const enterprise = await this.findOne(arg1);

                result = await this.enterpriseRepository.save({ ...enterprise, ...payload });
            } else {
                // create embedding
                await this.embeddingService.createEnterpriseEmbedding(arg1.enterpriseId);

                result = await this.enterpriseRepository.save({ ...arg1, ...payload });
            }

            this.cacheService.deleteEnterpriseInfo(result.enterpriseId);

            // create embedding
            if (result.status === EnterpriseStatus.ACTIVE) {
                await this.embeddingService.createEnterpriseEmbedding(result.enterpriseId);
            } else {
                await this.embeddingService.deleteOneEnterpriseEmbedding(result.enterpriseId);
            }

            return result;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async remove(id: string) {
        try {
            const enterprise = await this.findOne(id);
            this.cacheService.deleteEnterpriseInfo(enterprise.enterpriseId);

            // delete embedding
            await this.embeddingService.deleteOneEnterpriseEmbedding(enterprise.enterpriseId);

            return this.enterpriseRepository.remove(enterprise);
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async findJobsByEnterpriseId(enterpriseId: string, pagination: FindJobsByEnterpriseDto, isAdmin: boolean) {
        try {
            return await this.jobService.getJobOfEnterprise(enterpriseId, pagination, isAdmin);
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async checkStatus(id: string) {
        try {
            const enterprise = await this.enterpriseRepository.findOne({
                where: { account: { accountId: id } },
                relations: ['addresses'],
            });
            if (!enterprise || enterprise == null) {
                return new BadRequestException(EnterpriseErrorType.ENTERPRISE_CAN_REGISTER);
            }
            const temp = await this.categoriesService.findByIds(enterprise.categories);
            (enterprise as any).categories = temp;

            return new EnterpriseResponseDtoBuilder().setValue(enterprise).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async updatePartialInfoActive(payload: UpdateEnterpriseDto, user: JwtPayload) {
        try {
            const enterprise = await this.getActiveEnterprise(user.enterpriseId);
            await this.update(enterprise, payload);

            this.cacheService.deleteEnterpriseInfo(enterprise.enterpriseId);
            return new EnterpriseResponseDtoBuilder().setValue(payload).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    private async getActiveEnterprise(enterpriseId: string) {
        const enterprise = await this.enterpriseRepository.findOne({
            where: {
                enterpriseId,
                status: EnterpriseStatus.ACTIVE,
            },
        });

        if (!enterprise) {
            throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_NOT_ACTIVE);
        }
        return enterprise;
    }

    async cancelEnterprise(id: string) {
        try {
            const enterprise = await this.enterpriseRepository.findOneBy({ enterpriseId: id });
            if (enterprise.status === 'PENDING') {
                await this.enterpriseRepository.remove(enterprise);
                return new EnterpriseResponseDtoBuilder().success().build();
            } else {
                throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_NOT_PERMITTION);
            }
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async updateRegisterEnterprise(id: string, enterprise: UpdateEnterpriseDto) {
        try {
            const temp = await this.enterpriseRepository.findOneBy({ enterpriseId: id });
            if (!temp) {
                throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_NOT_FOUND);
            }
            if (temp.status === 'PENDING') {
                const updateEnterprise = await this.enterpriseRepository.save({ ...temp, ...enterprise });

                // create embedding
                if (updateEnterprise.status === EnterpriseStatus.ACTIVE) {
                    await this.embeddingService.createEnterpriseEmbedding(temp.enterpriseId);
                } else {
                    await this.embeddingService.deleteOneEnterpriseEmbedding(temp.enterpriseId);
                }

                return new EnterpriseResponseDtoBuilder().setValue(updateEnterprise).success().build();
            } else {
                throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_NOT_PERMITTION);
            }
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
    async totalJobsByEnterprise(enterpriseId: string): Promise<EnterpriseResponseDto> {
        try {
            const cachedTotal = await this.cacheService.getEnterpriseTotalJob(enterpriseId);
            if (cachedTotal) {
                new EnterpriseResponseDtoBuilder().setValue(cachedTotal).build();
            }

            const total = await this.jobService.totalJobsByEnterprise(enterpriseId);

            await this.cacheService.cacheEnterpriseTotalJob(enterpriseId, total);

            return new EnterpriseResponseDtoBuilder().setValue(total).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async createCandidateWishList(user: JwtPayload, payload: CreateCandidateWishListDto) {
        try {
            const candidate = await this.profileService.checkProfile(payload.profileId);
            if (!candidate) {
                throw new NotFoundException(ProfileErrorType.PROFILE_NOT_FOUND);
            }

            const enterprise = await this.enterpriseRepository.findOne({
                where: { enterpriseId: user.enterpriseId },
                relations: ['profiles'],
            });

            if (!enterprise) {
                throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_NOT_FOUND);
            }

            const isAlreadyInWishlist = enterprise.profiles.some((p) => p.profileId === payload.profileId);
            if (isAlreadyInWishlist) {
                throw new BadRequestException(EnterpriseErrorType.CANDIDATE_ADDED_WISHLIST);
            }

            enterprise.profiles.push(candidate);
            await this.enterpriseRepository.save(enterprise);

            return new EnterpriseResponseDtoBuilder().success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async deleteCandidateWishList(user: JwtPayload, candidateId: string) {
        try {
            const candidate = await this.profileService.checkProfile(candidateId);
            if (!candidate) {
                throw new NotFoundException(ProfileErrorType.PROFILE_NOT_FOUND);
            }

            const enterprise = await this.enterpriseRepository.findOne({
                where: { enterpriseId: user.enterpriseId },
                relations: ['profiles'],
            });

            if (!enterprise) {
                throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_NOT_FOUND);
            }

            const profileIndex = enterprise.profiles.findIndex((p) => p.profileId === candidateId);
            if (profileIndex === -1) {
                throw new BadRequestException(EnterpriseErrorType.CANDIDATE_NOT_IN_WISHLIST);
            }

            enterprise.profiles.splice(profileIndex, 1);
            await this.enterpriseRepository.save(enterprise);

            return new EnterpriseResponseDtoBuilder().success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getAllCandidate(options: FilterCandidatesProfileDto, user: JwtPayload) {
        try {
            const temp = await this.enterpriseRepository.findOne({ where: { enterpriseId: user.enterpriseId } });
            return this.profileService.getAllCandidate(options, user, temp.categories);
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async findOneById(id: string) {
        try {
            const enterprise = await this.enterpriseRepository.findOne({
                where: { enterpriseId: id },
                select: {
                    enterpriseId: true,
                    boostLimit: true,
                    totalPoints: true,
                },
            });
            if (!enterprise) {
                throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_NOT_FOUND);
            }

            return enterprise;
        } catch (error) {
            throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_NOT_FOUND);
        }
    }
    async updateBoostLimit(enterpriseId: string, points: number) {
        try {
            const enterprise = await this.findOneById(enterpriseId);
            if (!enterprise) {
                throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_NOT_FOUND);
            }
            enterprise.totalPoints += points;
            return this.enterpriseRepository.save(enterprise);
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async findEnterpriseById(id: string) {
        try {
            const enterprise = await this.enterpriseRepository.findOne({
                where: { enterpriseId: id },
                relations: ['account', 'websites', 'addresses'],
                select: {
                    account: {
                        accountId: true,
                    },
                },
            });

            if (!enterprise) {
                throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_NOT_FOUND);
            }
            const categories = await this.categoriesService.findByIds(enterprise.categories);

            (enterprise as any).categories = categories;

            const jobs = await this.jobService.getJobByIdEnterprise(id, 5);
            (enterprise as any).jobs = jobs;

            return new EnterpriseResponseDtoBuilder().setValue(enterprise).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async updateEnterprisePayment(
        enterpriseId: string,
        isPremium: boolean,
        totalPoints: number,
        isTrial: boolean,
        currentPoint: number
    ) {
        try {
            const enterprise = await this.enterpriseRepository.findOneBy({ enterpriseId });
            if (!enterprise) {
                throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_NOT_FOUND);
            }

            enterprise.isPremium = isPremium;
            enterprise.isTrial = isTrial;
            enterprise.totalPoints = totalPoints + currentPoint;

            return this.enterpriseRepository.save(enterprise);
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
    async updateCompanyAddress(id: string, payload: UpdateCompanyAddressDto): Promise<EnterpriseResponseDto> {
        try {
            const enterprise = await this.enterpriseRepository.findOne({
                where: { enterpriseId: id },
                relations: ['addresses'],
            });
            if (!enterprise) {
                throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_NOT_FOUND);
            }

            const addressIds = (enterprise.addresses || []).map((a) => a.addressId);

            if (addressIds.length > 0) {
                await Promise.all([
                    this.enterpriseRepository
                        .createQueryBuilder()
                        .relation(EnterpriseEntity, 'addresses')
                        .of(enterprise)
                        .remove(addressIds),
                    this.addressService.remove(addressIds),
                ]);
            }

            const address = await this.addressService.create(payload);

            await this.enterpriseRepository
                .createQueryBuilder()
                .relation(EnterpriseEntity, 'addresses')
                .of(enterprise)
                .add(address.value.addressId);

            const updatedEnterprise = await this.enterpriseRepository.findOne({
                where: { enterpriseId: id },
                relations: ['addresses'],
            });

            // create embedding
            await this.embeddingService.createEnterpriseEmbedding(enterprise.enterpriseId);

            await this.cacheService.deleteEnterpriseInfo(enterprise.enterpriseId);

            return new EnterpriseResponseDtoBuilder().setValue(updatedEnterprise).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getPendingStatusEnterprises(pagination: PaginationDto) {
        try {
            const [enterprises, total] = await this.enterpriseRepository.findAndCount({
                where: {
                    status: EnterpriseStatus.PENDING,
                    name: pagination.options ? ILike(`${pagination.options}%`) : Not(IsNull()),
                },
                relations: {
                    addresses: true,
                },
                select: {
                    addresses: {
                        addressId: true,
                        city: true,
                        country: true,
                        street: true,
                        zipCode: true,
                    },
                },
                skip: (Number(pagination.page) - 1) * Number(pagination.take),
                take: Number(pagination.take),
                order: { createdAt: 'ASC' },
            });

            const enterprisesWithCategories = await this.getCategoriesOfEnterprises(enterprises);

            const meta = new PageMetaDto({
                pageOptionsDto: pagination,
                itemCount: total,
            });

            return new EnterpriseResponseDtoBuilder()
                .setValue(new PageDto<any>(enterprisesWithCategories, meta))
                .build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async updateEnterpriseStatus(enterpriseId: string, payload: UpdateStatusEnterpriseDto) {
        try {
            const enterprise = await this.enterpriseRepository.findOne({
                where: { enterpriseId },
                relations: {
                    account: {
                        fcmTokens: true,
                    },
                },
                select: {
                    enterpriseId: true,
                    email: true,
                    name: true,
                    status: true,
                    account: {
                        accountId: true,
                        email: true,
                        fcmTokens: {
                            tokenId: true,
                            token: true,
                        },
                    },
                },
            });

            if (!enterprise) {
                throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_NOT_FOUND);
            }

            if (enterprise.status === payload.status) {
                throw new WarningException(EnterpriseErrorType.ENTERPRISE_STATUS_ALREADY_SET);
            }

            // update the status of the enterprise
            await this.update(enterpriseId, { status: payload.status });

            if (payload.status !== EnterpriseStatus.ACTIVE) {
                await this.authService.updateRoles(enterprise.account.accountId, [Role.USER]);
            } else {
                await this.authService.updateRoles(enterprise.account.accountId, [Role.USER, Role.ENTERPRISE]);
            }

            // Notify the enterprise about the status change
            await this.notifyEnterpriseStatusChange(enterprise, payload.status);

            // Send email to the enterprise about the status change
            this.sendEmailEnterpriseStatusChange(enterprise, payload.status, payload.reason);

            return new EnterpriseResponseDtoBuilder().success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    private async notifyEnterpriseStatusChange(enterprise: EnterpriseEntity, status: EnterpriseStatus) {
        try {
            const title =
                status === EnterpriseStatus.ACTIVE
                    ? 'Enterprise Registration Approved'
                    : status === EnterpriseStatus.BLOCKED
                      ? 'Enterprise Registration Blocked'
                      : status === EnterpriseStatus.PENDING
                        ? 'Enterprise Registration Pending'
                        : 'Enterprise Registration Rejected';
            const message =
                status === EnterpriseStatus.ACTIVE
                    ? 'Your enterprise registration has been approved.'
                    : status === EnterpriseStatus.BLOCKED
                      ? 'Your enterprise registration has been blocked.'
                      : status === EnterpriseStatus.PENDING
                        ? 'Your enterprise registration is pending.'
                        : 'Your enterprise registration has been rejected.';

            const notification = await this.notificationService.create({
                accountId: enterprise.account.accountId,
                type: NotificationType.ENTERPRISE_REGISTRATION_APPROVED,
                title,
                message,
            });

            // Send notification to the enterprise account
            const fcmTokens = enterprise.account?.fcmTokens?.map((token) => token.token);
            if (fcmTokens.length > 0) await this.notificationService.sendNotificationToMany(notification, fcmTokens);
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    private async sendEmailEnterpriseStatusChange(
        enterprise: EnterpriseEntity,
        status: EnterpriseStatus,
        reason?: string
    ) {
        try {
            // Send email to the enterprise account
            const emails = [];

            if (enterprise.email) emails.push(enterprise.email);
            if (enterprise.account.email && !emails.includes(enterprise.account.email))
                emails.push(enterprise.account.email);

            if (emails.length > 0) {
                this.mailService.sendEnterpriseStatusMail(emails, enterprise.name, status, reason);
            }
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getStatusEnterprises(enterpriseId: string) {
        try {
            const enterprise = await this.enterpriseRepository.findOne({
                where: { enterpriseId },
                relations: ['addresses', 'jobs', 'profiles'],
            });
            if (!enterprise) {
                throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_NOT_FOUND);
            }
            const categories = await this.categoriesService.findByIds(enterprise.categories);
            (enterprise as any).categories = categories;
            const totalJobs = enterprise.jobs?.length || 0;
            const totalBoostedJobs = enterprise.jobs?.filter((job) => job.isBoost === true).length || 0;
            const totalCandidateFavorites = enterprise.profiles?.length || 0;
            const latestJobs =
                enterprise.jobs
                    ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5) || [];
            const result = { ...enterprise, totalJobs, totalBoostedJobs, totalCandidateFavorites, latestJobs };
            return new EnterpriseResponseDtoBuilder().setValue(result).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getCategoriesOfEnterprises(enterprises: EnterpriseEntity[]) {
        try {
            // Group categories and fetch once
            const categoryIds = enterprises.map((enterprise) => enterprise.categories).flat();
            const categories = await this.categoriesService.findByIds(categoryIds);

            // Map categories to enterprises
            const enterprisesWithCategories = enterprises.map((enterprise) => {
                const fullyCategories = categories.filter((category) =>
                    enterprise.categories.includes(category.categoryId)
                );
                return { ...enterprise, categories: fullyCategories };
            });

            return enterprisesWithCategories;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getOverviewEnterprises(name: string) {
        try {
            const enterprises = await this.enterpriseRepository.find({
                where: {
                    name: ILike(`%${name}%`),
                },
                select: {
                    enterpriseId: true,
                    name: true,
                    logoUrl: true,
                    status: true,
                },
                take: 20,
            });

            return new EnterpriseResponseDtoBuilder().setValue(enterprises).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getTotalEnterprise() {
        try {
            return this.enterpriseRepository.count();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
