import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreateTagDto, UpdateTagDto, TagResponseDto, TagResponseDtoBuilder } from '../dtos';
import { TagRepository } from '../repositories/tag.repository';
import { TagEntity } from '@database/entities';
import { PageDto, PageMetaDto, PaginationDto } from '@common/dtos';

@Injectable()
export class TagService {
    constructor(private readonly tagRepository: TagRepository) {}

    async create(createTagDtos: CreateTagDto[]): Promise<TagResponseDto> {
        try {
            const tagNames = createTagDtos.map((tag) => tag.name);

            const existingTags = await this.tagRepository
                .createQueryBuilder('tag')
                .where('tag.name IN (:...names)', { names: tagNames })
                .getMany();

            if (existingTags.length > 0) {
                const existingNames = existingTags.map((tag) => tag.name);
                throw new BadRequestException(`Tags with these names already exist: ${existingNames.join(', ')}`);
            }

            const tags = this.tagRepository.create(createTagDtos);
            await this.tagRepository.save(tags);

            return new TagResponseDtoBuilder().success().setValue(tags).build();
        } catch (error) {
            throw new InternalServerErrorException(`Failed to create tags: ${error.message}`);
        }
    }

    async findAll(options: PaginationDto): Promise<TagResponseDto> {
        try {
            const { order, take, skip } = options;

            const [tags, total] = await this.tagRepository.findAndCount({
                order: { name: order }, // Assumes 'name' is the column to order by
                take,
                skip,
            });
            const meta = new PageMetaDto({
                pageOptionsDto: options,
                itemCount: total,
            });

            return new TagResponseDtoBuilder().success().setValue(new PageDto<TagEntity>(tags, meta)).build();
        } catch (error) {
            throw new InternalServerErrorException('Failed to retrieve tags.');
        }
    }

    async findOne(id: string): Promise<TagResponseDto> {
        const tag = await this.tagRepository.findOneBy({ tagId: id });
        if (!tag) {
            throw new NotFoundException('Tag not found.');
        }
        return new TagResponseDtoBuilder().success().setValue(tag).build();
    }

    async update(id: string, updateTagDto: UpdateTagDto): Promise<TagResponseDto> {
        const tag = await this.tagRepository.findOneBy({ tagId: id });
        if (!tag) {
            throw new NotFoundException('Tag not found.');
        }
        await this.tagRepository.save(tag);

        return new TagResponseDtoBuilder().success().setValue(tag).build();
    }

    async remove(id: string): Promise<void> {
        const tag = await this.tagRepository.findOneBy({ tagId: id });
        if (!tag) {
            throw new NotFoundException('Tag not found.');
        }

        await this.tagRepository.remove(tag);
    }
    async findByIds(tagIds: string[]): Promise<TagEntity[]> {
        return this.tagRepository.findByIds(tagIds);
    }
}
