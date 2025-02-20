import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreateTagDto, UpdateTagDto, TagResponseDto, TagResponseDtoBuilder } from '../dtos';
import { TagRepository } from '../repositories/tag.repository';
import { TagEntity } from '@database/entities';

@Injectable()
export class TagService {
    constructor(private readonly tagRepository: TagRepository) {}

    async create(createTagDto: CreateTagDto): Promise<TagResponseDto> {
        try {
            const existingTag = await this.tagRepository.findOneBy({ name: createTagDto.name });
            if (existingTag) {
                throw new BadRequestException('Tag with this name already exists.');
            }

            const tag = this.tagRepository.create(createTagDto);
            await this.tagRepository.save(tag);

            return new TagResponseDtoBuilder().success().build();
        } catch (error) {
            throw new InternalServerErrorException('Failed to create tag.');
        }
    }

    async findAll(): Promise<TagResponseDto> {
        try {
            const tags = await this.tagRepository.find();
            return new TagResponseDtoBuilder().success().setValue(tags).build();
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

        Object.assign(tag, updateTagDto);
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
