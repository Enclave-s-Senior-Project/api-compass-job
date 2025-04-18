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

@Injectable()
export class EnterpriseService {
    constructor(
        @Inject(forwardRef(() => JobService)) private readonly jobService: JobService,
        @Inject(forwardRef(() => CategoryService)) private readonly categoriesService: CategoryService,
        @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
        private readonly profileService: UserService,
        private readonly enterpriseRepository: EnterpriseRepository,
        private readonly addressService: AddressService,
        private readonly cacheService: CacheService
    ) {}

    async create(createEnterpriseDto: CreateEnterpriseDto, user: JwtPayload): Promise<EnterpriseResponseDto> {
        try {
            const isEnterprises = await this.enterpriseRepository.findOne({
                where: { account: { accountId: user.accountId } },
            });
            if (isEnterprises) {
                throw new BadRequestException(EnterpriseErrorType.ENTERPRISE_ALREADY_EXISTS);
            }
            const checkEmail = await this.enterpriseRepository.findOne({ where: { email: createEnterpriseDto.email } });
            const checkEmailAccount = await this.authService.checkEmail(createEnterpriseDto.email);
            if (checkEmail || checkEmailAccount) {
                throw new BadRequestException(EnterpriseErrorType.EMAIL_ALREADY_EXISTS);
            }
            const enterprise = await this.enterpriseRepository.create({
                ...createEnterpriseDto,
                account: { accountId: user.accountId },
            });
            await this.enterpriseRepository.save(enterprise);
            return new EnterpriseResponseDtoBuilder().setValue(enterprise).build();
        } catch (error) {
            console.error('Error creating enterprise:', error);
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

            this.cacheService.cacheEnterpriseInfo(enterpriseId, enterprise);

            return new EnterpriseResponseDtoBuilder().setValue(enterprise).success().build();
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
                    categories: true,
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
            console.error('Error fetching enterprise by account ID:', error);
            throw error;
        }
    }

    async findAll(pagination: PaginationDto) {
        try {
            const [profiles, total] = await this.enterpriseRepository.findAndCount({
                skip: (Number(pagination.page) - 1) * Number(pagination.take),
                take: Number(pagination.take),
                relations: ['addresses'],
            });
            const meta = new PageMetaDto({
                pageOptionsDto: pagination,
                itemCount: total,
            });
            if (!profiles) {
                throw new EnterpriseResponseDtoBuilder()
                    .badRequestContent(EnterpriseErrorType.ENTERPRISE_NOT_FOUND)
                    .build();
            }
            return new EnterpriseResponseDtoBuilder().setValue(new PageDto<EnterpriseEntity>(profiles, meta)).build();
        } catch (error) {
            if (error instanceof HttpException) {
                return new EnterpriseResponseDtoBuilder()
                    .setCode(error.getStatus())
                    .setMessageCode(error.message)
                    .build();
            }
            return new EnterpriseResponseDtoBuilder().internalServerError().build();
        }
    }

    async findOne(id: string) {
        const enterprise = await this.enterpriseRepository.findOne({
            where: { enterpriseId: id },
            relations: ['account', 'websites', 'jobs', 'addresses'],
        });

        if (!enterprise) {
            throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_ALREADY_EXISTS);
        }

        return enterprise;
    }

    // Overloaded update method signatures
    public update(id: string, payload: UpdateEnterpriseDto): Promise<EnterpriseEntity>;
    public update(enterprise: EnterpriseEntity, payload: UpdateEnterpriseDto): Promise<EnterpriseEntity>;

    public async update(
        arg1: string | EnterpriseEntity,
        payload: UpdateCompanyInfoDto | UpdateFoundingInfoDto
    ): Promise<EnterpriseEntity> {
        if (typeof arg1 === 'string') {
            const enterprise = await this.findOne(arg1);
            this.cacheService.deleteEnterpriseInfo(enterprise.enterpriseId);
            return this.enterpriseRepository.save({ ...enterprise, ...payload });
        }
        this.cacheService.deleteEnterpriseInfo(arg1.enterpriseId);
        return this.enterpriseRepository.save({ ...arg1, ...payload });
    }

    async remove(id: string) {
        const enterprise = await this.findOne(id);
        this.cacheService.deleteEnterpriseInfo(enterprise.enterpriseId);
        return this.enterpriseRepository.remove(enterprise);
    }

    // async findByIndustryType(industryType: string) {
    //     return this.enterpriseRepository.find({
    //         where: { industryType },
    //         relations: ['account', 'websites', 'jobs', 'addresses'],
    //     });
    // }
    async findJobsByEnterpriseId(enterpriseId: string, pagination: FindJobsByEnterpriseDto) {
        try {
            return await this.jobService.getJobOfEnterprise(enterpriseId, pagination);
        } catch (error) {
            console.error(error);
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
                return new EnterpriseResponseDtoBuilder()
                    .badRequestContent(EnterpriseErrorType.ENTERPRISE_CAN_REGISTER)
                    .build();
            }
            const temp = await this.categoriesService.findByIds(enterprise.categories);
            (enterprise as any).categories = temp;

            return new EnterpriseResponseDtoBuilder().setValue(enterprise).build();
        } catch (error) {
            console.error('Error creating enterprise:', error);
            throw error;
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
            throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_NOT_FOUND);
        }
        return enterprise;
    }

    async cancelEnterprise(id: string) {
        try {
            const enterprise = await this.enterpriseRepository.findOneBy({ enterpriseId: id });
            if (enterprise.status === 'PENDING') {
                const temp = await this.enterpriseRepository.remove(enterprise);
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
            const cacheKey = `enterprise-total-job:${enterpriseId}`;

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
            console.log('error', error);
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
        const temp = await this.enterpriseRepository.findOne({ where: { enterpriseId: user.enterpriseId } });
        return this.profileService.getAllCandidate(options, user, temp.categories);
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
            if (error instanceof HttpException) {
                return new EnterpriseResponseDtoBuilder()
                    .setCode(error.getStatus())
                    .setMessageCode(error.message)
                    .build();
            }
            return new EnterpriseResponseDtoBuilder().internalServerError().build();
        }
    }

    async updateEnterprisePayment(enterpriseId: string, isPremium: boolean, totalPoints: number, isTrial: boolean) {
        try {
            const enterprise = await this.enterpriseRepository.findOneBy({ enterpriseId });
            if (!enterprise) {
                throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_NOT_FOUND);
            }

            enterprise.isPremium = isPremium;
            enterprise.isTrial = isTrial;
            enterprise.totalPoints = totalPoints;

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

            await this.cacheService.deleteEnterpriseInfo(enterprise.enterpriseId);

            return new EnterpriseResponseDtoBuilder().setValue(updatedEnterprise).build();
        } catch (error) {
            console.error('Error updating company address:', error); // Fixed typo in log
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
