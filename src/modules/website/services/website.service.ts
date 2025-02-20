import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebsiteEntity } from '@database/entities';
import { CreateWebsiteDto, UpdateWebsiteDto } from '../dtos';

@Injectable()
export class WebsiteService {
    constructor(
        @InjectRepository(WebsiteEntity)
        private readonly websiteRepository: Repository<WebsiteEntity>
    ) {}

    async create(createWebsiteDto: CreateWebsiteDto): Promise<WebsiteEntity> {
        const website = this.websiteRepository.create(createWebsiteDto);
        return this.websiteRepository.save(website);
    }

    async findAll(): Promise<WebsiteEntity[]> {
        return this.websiteRepository.find({ relations: ['enterprise', 'profile'] });
    }

    async findOne(id: string): Promise<WebsiteEntity> {
        const website = await this.websiteRepository.findOne({
            where: { websiteId: id },
            relations: ['enterprise', 'profile'],
        });

        if (!website) {
            throw new NotFoundException(`Website with ID ${id} not found.`);
        }

        return website;
    }

    async update(id: string, updateWebsiteDto: UpdateWebsiteDto): Promise<WebsiteEntity> {
        const website = await this.findOne(id);
        Object.assign(website, updateWebsiteDto);
        return this.websiteRepository.save(website);
    }

    async remove(id: string): Promise<void> {
        const website = await this.findOne(id);
        await this.websiteRepository.remove(website);
    }

    async findByProfileId(profileId: string): Promise<WebsiteEntity[]> {
        return this.websiteRepository.find({
            where: { profile: { profileId } },
            relations: ['profile'],
        });
    }

    async findByEnterpriseId(enterpriseId: string): Promise<WebsiteEntity[]> {
        return this.websiteRepository.find({
            where: { enterprise: { enterpriseId } },
            relations: ['enterprise'],
        });
    }
}
