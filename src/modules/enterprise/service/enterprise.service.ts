import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EnterpriseRepository } from '../repositories';
import { CreateEnterpriseDto } from '../dtos/create-enterprise.dto';
import { UpdateEnterpriseDto } from '../dtos/update-enterprise.dto';
import { EnterpriseResponseDto, EnterpriseResponseDtoBuilder } from '../dtos';
import { JwtPayload } from '@common/dtos';
import { EnterpriseErrorType } from '@common/errors/enterprises-error-type';
import { UpdateCompanyInfoDto } from '../dtos/update-company-info.dto';
import { EnterpriseEntity } from '@database/entities';
import { redisProviderName } from '@cache/cache.provider';
import { RedisCommander } from 'ioredis';
import { EnterpriseStatus } from '@common/enums';
import { UpdateFoundingInfoDto } from '../dtos/update-founding-dto';

@Injectable()
export class EnterpriseService {
    constructor(
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
            return enterprise;
        } catch (error) {
            console.error('Error fetching enterprise by account ID:', error);
            throw error;
        }
    }

    async findAll() {
        return this.enterpriseRepository.find({ relations: ['account', 'websites', 'jobs', 'addresses'] });
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

    async update(id: string, updateEnterpriseDto: UpdateEnterpriseDto) {
        const enterprise = await this.findOne(id);
        Object.assign(enterprise, updateEnterpriseDto);
        return this.enterpriseRepository.save(enterprise);
    }

    async remove(id: string) {
        const enterprise = await this.findOne(id);
        return this.enterpriseRepository.remove(enterprise);
    }

    async findByAccountId(accountId: string) {
        const enterprise = await this.enterpriseRepository.findOne({
            where: { account: { accountId } },
            relations: ['account', 'websites', 'jobs', 'addresses'],
        });

        if (!enterprise) {
            throw new NotFoundException(`Enterprise with Account ID ${accountId} not found.`);
        }

        return enterprise;
    }

    async findByIndustryType(industryType: string) {
        return this.enterpriseRepository.find({
            where: { industryType },
            relations: ['account', 'websites', 'jobs', 'addresses'],
        });
    }
    async findJobsByEnterpriseId(enterpriseId: string) {
        const enterprise = await this.enterpriseRepository.findOne({
            where: { enterpriseId },
            relations: ['jobs'],
        });

        if (!enterprise) {
            throw new NotFoundException(`Enterprise with ID ${enterpriseId} not found.`);
        }

        return enterprise.jobs;
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
            throw error;
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

    async updateCompanyInfo(payload: UpdateCompanyInfoDto, user: JwtPayload) {
        try {
            const enterprise = await this.enterpriseRepository.findOne({
                where: { enterpriseId: user.enterpriseId, status: EnterpriseStatus.ACTIVE },
                relations: {
                    addresses: true,
                },
            });
            const { addresses, ...enterpriseWithoutAddresses } = enterprise;
            const updatedEnterprise = await this.enterpriseRepository.save({
                ...enterpriseWithoutAddresses,
                ...payload,
            });

            this.storeEnterpriseOnRedis(updatedEnterprise.enterpriseId, updatedEnterprise);

            return new EnterpriseResponseDtoBuilder().setValue(updatedEnterprise).build();
        } catch (error) {
            console.error('Error updating company info:', error);
            return new EnterpriseResponseDtoBuilder().internalServerError().build();
        }
    }

    async updateFoundingInfo(payload: UpdateFoundingInfoDto, user: JwtPayload) {}

    async storeEnterpriseOnRedis(enterpriseId: string, payload: EnterpriseEntity) {
        await this.redisCache.set(`enterprise:${enterpriseId}`, JSON.stringify(payload), 'EX', 432000); // 5 days
    }

    async getEnterpriseFromRedis(enterpriseId: string) {
        return JSON.parse(await this.redisCache.get(`enterprise:${enterpriseId}`));
    }
}
