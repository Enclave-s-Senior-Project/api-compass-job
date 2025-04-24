import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateTagDto, UpdateTagDto, TagResponseDto, TagResponseDtoBuilder } from '../dtos';
import { TagRepository } from '../repositories/tag.repository';
import { TagEntity } from '@database/entities';
import { PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { ILike, IsNull, Not, In } from 'typeorm';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import { TagErrorType } from '../../../common/errors/tag.errors';
import { WarningException } from '@src/common/http/exceptions/warning.exception';

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
                throw new BadRequestException(TagErrorType.TAG_NAME_ALREADY_EXISTS);
            }

            const tags = this.tagRepository.create(createTagDtos);
            await this.tagRepository.save(tags);

            return new TagResponseDtoBuilder().success().setValue(tags).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async findAll(filter: PaginationDto, name?: string): Promise<TagResponseDto> {
        try {
            const { order, take, skip, options } = filter;

            const [tags, total] = await this.tagRepository.findAndCount({
                order: { name: order },
                where: { name: name ? ILike(`%${name}%`) : Not(IsNull()) },
                take,
                skip,
            });
            const meta = new PageMetaDto({
                pageOptionsDto: filter,
                itemCount: total,
            });

            return new TagResponseDtoBuilder().success().setValue(new PageDto<TagEntity>(tags, meta)).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async findOne(id: string): Promise<TagResponseDto> {
        try {
            const tag = await this.tagRepository.findOneBy({ tagId: id });
            if (!tag) {
                throw new NotFoundException(TagErrorType.TAG_NOT_FOUND);
            }
            return new TagResponseDtoBuilder().success().setValue(tag).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async update(id: string, updateTagDto: UpdateTagDto): Promise<TagResponseDto> {
        try {
            const tag = await this.tagRepository.findOneBy({ tagId: id });
            if (!tag) {
                throw new NotFoundException(TagErrorType.TAG_NOT_FOUND);
            }
            await this.tagRepository.save({ ...tag, ...updateTagDto });

            return new TagResponseDtoBuilder().success().setValue(tag).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async remove(id: string): Promise<TagResponseDto> {
        try {
            let tag: TagEntity;
            try {
                tag = await this.tagRepository.findOneBy({ tagId: id });
            } catch (error) {
                throw new WarningException(TagErrorType.TAG_MAY_BE_IN_USE);
            }
            if (!tag) {
                throw new NotFoundException(TagErrorType.TAG_NOT_FOUND);
            }

            await this.tagRepository.remove(tag);
            return new TagResponseDtoBuilder().success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async removeBulk(tagIds: string[]): Promise<TagResponseDto> {
        try {
            // Find tags that exist
            const tags = await this.tagRepository.find({
                where: { tagId: In(tagIds) },
            });

            // If no tags found at all
            if (tags.length === 0) {
                throw new NotFoundException(TagErrorType.TAG_NOT_FOUND);
            }

            // If some tags not found, provide detailed error
            if (tags.length !== tagIds.length) {
                const foundIds = tags.map((tag) => tag.tagId);
                const missingIds = tagIds.filter((id) => !foundIds.includes(id));

                if (missingIds.length === 1) {
                    throw new NotFoundException(TagErrorType.TAG_NOT_FOUND);
                } else {
                    throw new NotFoundException(TagErrorType.TAG_NOT_FOUND);
                }
            }

            // Delete the tags
            try {
                await this.tagRepository.remove(tags);
            } catch (error) {
                throw new WarningException(TagErrorType.TAG_MAY_BE_IN_USE);
            }

            return new TagResponseDtoBuilder().success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async findByIds(tagIds: string[]): Promise<TagEntity[]> {
        return await this.tagRepository.findByIds(tagIds);
    }

    async findByName(name?: string): Promise<TagResponseDto> {
        try {
            let tags: TagEntity[];

            if (!name?.trim()) {
                tags = await this.tagRepository.find();
            } else {
                tags = await this.tagRepository.find({
                    where: { name: ILike(`%${name}%`) },
                });
            }

            return new TagResponseDtoBuilder().success().setValue(tags).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
