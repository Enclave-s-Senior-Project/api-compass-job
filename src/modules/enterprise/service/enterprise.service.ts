import { Injectable, NotFoundException } from '@nestjs/common';
import { EnterpriseRepository } from '../repositories';
import { CreateEnterpriseDto } from '../dtos/create-enterprise.dto';
import { UpdateEnterpriseDto } from '../dtos/update-enterprise.dto';
import { JwtPayload } from '@modules/auth/dtos';
import { EnterpriseResponseDto, EnterpriseResponseDtoBuilder } from '../dtos';

@Injectable()
export class EnterpriseService {
    constructor(private readonly enterpriseRepository: EnterpriseRepository) {}

    async create(createEnterpriseDto: CreateEnterpriseDto, user: JwtPayload): Promise<EnterpriseResponseDto> {
        try {
            const enterprise = await this.enterpriseRepository.create({
                ...createEnterpriseDto,
                account: { accountId: user.accountId },
            });
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
        const enterprise = await this.enterpriseRepository.findOne({
            where: { enterpriseId },
            relations: ['addresses'],
        });

        if (!enterprise) {
            throw new NotFoundException(`Enterprise with ID ${enterpriseId} not found.`);
        }

        return enterprise.addresses;
    }
}
