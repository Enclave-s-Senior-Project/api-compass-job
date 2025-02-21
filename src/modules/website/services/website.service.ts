import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagEntity, WebsiteEntity } from '@database/entities';
import { CreateWebsiteDto, UpdateWebsiteDto, WebsiteResponseDto, WebsiteResponseDtoBuilder } from '../dtos';
import { PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { Website } from '../entities/website.entity';

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

    async findAll(options: PaginationDto): Promise<WebsiteResponseDto> {
        const { order, take, skip } = options;

        const [websites, total] = await this.websiteRepository.findAndCount({
            relations: ['enterprise', 'profile'],
            order: { socialType: order },
            take,
            skip,
        });
        const meta = new PageMetaDto({
            pageOptionsDto: options,
            itemCount: total,
        });

        return new WebsiteResponseDtoBuilder().success().setValue(new PageDto<WebsiteEntity>(websites, meta)).build();
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
