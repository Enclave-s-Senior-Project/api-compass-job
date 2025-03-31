import { BadRequestException, forwardRef, HttpException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EnterpriseRepository } from '../repositories';
import { CreateEnterpriseDto } from '../dtos/create-enterprise.dto';
import { UpdateEnterpriseDto } from '../dtos/update-enterprise.dto';
import { EnterpriseResponseDto, EnterpriseResponseDtoBuilder, RegisterPremiumEnterpriseDto } from '../dtos';
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

@Injectable()
export class EnterpriseService {
    constructor(
        @Inject(forwardRef(() => JobService)) private readonly jobService: JobService,
        private readonly profileService: UserService,
        private readonly enterpriseRepository: EnterpriseRepository,
        @Inject(redisProviderName) private readonly redisCache: RedisCommander
    ) {}

    async create(createEnterpriseDto: CreateEnterpriseDto, user: JwtPayload): Promise<EnterpriseResponseDto> {
        try {
            const isEnterprises = await this.enterpriseRepository.findOne({
                where: { account: { accountId: user.accountId } },
            });
            if (isEnterprises) {
                return new EnterpriseResponseDtoBuilder()
                    .badRequestContent(EnterpriseErrorType.ENTERPRISE_ALREADY_EXISTS)
                    .build();
            }
            const enterprise = await this.enterpriseRepository.create({
                ...createEnterpriseDto,
                account: { accountId: user.accountId },
            });
            await this.enterpriseRepository.save(enterprise);
            return new EnterpriseResponseDtoBuilder().setValue(enterprise).build();
        } catch (error) {
            console.error('Error creating enterprise:', error);
            throw error;
        }
    }

    async getEnterpriseByAccountId(accountId: string) {
        try {
            const enterprise = await this.enterpriseRepository.findOne({ where: { account: { accountId } } });
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
            throw new NotFoundException(`Enterprise with ID ${id} not found.`);
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
            return this.enterpriseRepository.save({ ...enterprise, ...payload });
        }
        return this.enterpriseRepository.save({ ...arg1, ...payload });
    }

    async remove(id: string) {
        const enterprise = await this.findOne(id);
        return this.enterpriseRepository.remove(enterprise);
    }

    async findByIndustryType(industryType: string) {
        return this.enterpriseRepository.find({
            where: { industryType },
            relations: ['account', 'websites', 'jobs', 'addresses'],
        });
    }
    async findJobsByEnterpriseId(enterpriseId: string, pagination: PaginationDto) {
        try {
            const result = await this.jobService.getJobOfEnterprise(enterpriseId, pagination);
            return new JobResponseDtoBuilder().setValue(result).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
    async findAddressesByEnterpriseId(enterpriseId: string) {
        try {
            const enterprise = await this.enterpriseRepository.findOne({
                where: { enterpriseId },
                relations: ['addresses'],
            });

            if (!enterprise) {
                throw new NotFoundException(`Enterprise with ID ${enterpriseId} not found.`);
            }

            return new EnterpriseResponseDtoBuilder().setValue(enterprise).build();
        } catch (error) {
            console.error('Error creating enterprise:', error);
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async checkStatus(id: string) {
        try {
            const enterprise = await this.enterpriseRepository.findOne({
                where: { account: { accountId: id } },
            });
            if (!enterprise || enterprise == null) {
                return new EnterpriseResponseDtoBuilder()
                    .badRequestContent(EnterpriseErrorType.ENTERPRISE_CAN_REGISTER)
                    .build();
            }
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

            // this.storeEnterpriseOnRedis(updatedEnterprise.enterpriseId, updatedEnterprise);

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

    async storeEnterpriseOnRedis(enterpriseId: string, payload: EnterpriseEntity) {
        await this.redisCache.set(`enterprise:${enterpriseId}`, JSON.stringify(payload), 'EX', 432000); // 5 days
    }

    async getEnterpriseFromRedis(enterpriseId: string) {
        return JSON.parse(await this.redisCache.get(`enterprise:${enterpriseId}`));
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

            // Check Redis cache first
            const cachedTotal = await this.redisCache.get(cacheKey);
            if (cachedTotal) {
                new EnterpriseResponseDtoBuilder().setValue(cachedTotal).build();
            }

            // Fetch from database if not cached
            const total = await this.jobService.totalJobsByEnterprise(enterpriseId);

            // Store result in Redis with expiration time
            await this.redisCache.set(cacheKey, JSON.stringify(total), 'EX', 432000);

            return new EnterpriseResponseDtoBuilder().setValue(total).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
    async updateEnterprisePremium(user: JwtPayload, payload: RegisterPremiumEnterpriseDto) {
        try {
            console.log('payload', payload);
            const enterprise = await this.enterpriseRepository.findOneBy({ enterpriseId: user.enterpriseId });
            if (!enterprise) {
                throw new NotFoundException(EnterpriseErrorType.ENTERPRISE_NOT_FOUND);
            }

            // Assign new premium type and enable premium
            enterprise.premiumType = payload.premiumType;
            enterprise.isPremium = true;

            // Save - TypeORM will trigger `@BeforeUpdate()`
            const updateEnterprise = await this.enterpriseRepository.save(enterprise);

            return new EnterpriseResponseDtoBuilder().setValue(updateEnterprise).success().build();
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
                console.log('Profile not found');
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
            console.log('error', error);
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getAllCandidate(options: FilterCandidatesProfileDto, user: JwtPayload) {
        return this.profileService.getAllCandidate(options, user);
    }
}
