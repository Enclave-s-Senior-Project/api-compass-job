import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagEntity, WebsiteEntity } from '@database/entities';
import { CreateWebsiteDto, UpdateWebsiteDto, WebsiteResponseDto, WebsiteResponseDtoBuilder } from '../dtos';
import { JwtPayload, PageDto, PageMetaDto, PaginationDto } from '@common/dtos';

@Injectable()
export class WebsiteService {
    constructor(
        @InjectRepository(WebsiteEntity)
        private readonly websiteRepository: Repository<WebsiteEntity>
    ) {}

    async create(createWebsiteDto: CreateWebsiteDto): Promise<WebsiteResponseDto> {
        try {
            const website = this.websiteRepository.create(createWebsiteDto);
            await this.websiteRepository.save(website);
            return new WebsiteResponseDtoBuilder().success().build();
        } catch (error) {
            throw new BadRequestException(error);
        }
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

    async findOne(id: string): Promise<WebsiteResponseDto> {
        try {
            const website = await this.websiteRepository.findOne({
                where: { websiteId: id },
                relations: ['enterprise', 'profile'],
            });

            if (!website) {
                throw new NotFoundException(`Website with ID ${id} not found.`);
            }

            return new WebsiteResponseDtoBuilder().success().setValue(website).build();
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async update(id: string, updateWebsiteDto: UpdateWebsiteDto): Promise<WebsiteResponseDto> {
        try {
            const website = await this.websiteRepository.update(id, updateWebsiteDto);
            return new WebsiteResponseDtoBuilder().success().setValue(website).build();
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async remove(id: string): Promise<WebsiteResponseDto> {
        try {
            await this.websiteRepository.delete(id);
            return new WebsiteResponseDtoBuilder().success().build();
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async findByProfileId(profileId: string): Promise<WebsiteResponseDto> {
        try {
            return new WebsiteResponseDtoBuilder()
                .setValue(
                    await this.websiteRepository.find({
                        where: { profile: { profileId } },
                        relations: ['profile'],
                    })
                )
                .success()
                .build();
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async findByEnterpriseId(enterpriseId: string): Promise<WebsiteResponseDto> {
        try {
            return new WebsiteResponseDtoBuilder()
                .setValue(
                    await this.websiteRepository.find({
                        where: { enterprise: { enterpriseId } },
                        relations: ['enterprise'],
                    })
                )
                .success()
                .build();
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async createWebsiteByProfileId(createWebsiteDto: CreateWebsiteDto, user: JwtPayload): Promise<WebsiteResponseDto> {
        const website = this.websiteRepository.create({
            ...createWebsiteDto,
            profile: { profileId: user.profileId },
        });
        return new WebsiteResponseDtoBuilder().setValue(this.websiteRepository.save(website)).success().build();
    }
    async createWebsiteByEnterpriseId(
        createWebsiteDto: CreateWebsiteDto,
        user: JwtPayload
    ): Promise<WebsiteResponseDto> {
        const website = this.websiteRepository.create({
            ...createWebsiteDto,
            enterprise: { enterpriseId: user.enterpriseId },
        });
        return new WebsiteResponseDtoBuilder().setValue(this.websiteRepository.save(website)).success().build();
    }
}
