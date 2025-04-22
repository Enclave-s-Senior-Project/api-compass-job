import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, IsNull, Repository } from 'typeorm';
import {
    CategoryResponseDto,
    CategoryResponseDtoBuilder,
    CreateCategoryDto,
    CreateChildCategoriesDto,
    UpdateCategoryDto,
} from '../dtos';
import { PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { CategoryEntity } from '@database/entities';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';

@Injectable()
export class CategoryService {
    constructor(
        @InjectRepository(CategoryEntity)
        private readonly categoryRepository: Repository<CategoryEntity>
    ) {}

    async create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
        const category = this.categoryRepository.create({
            categoryName: createCategoryDto.categoryName,
            parent: { categoryId: createCategoryDto.parentId },
        });
        await this.categoryRepository.save(category);
        return new CategoryResponseDtoBuilder().success().build();
    }

    async createChildCategories(
        parentId: string,
        createChildCategoriesDto: CreateChildCategoriesDto
    ): Promise<CategoryResponseDto[]> {
        const parentCategory = await this.categoryRepository.findOne({ where: { categoryId: parentId } });
        if (!parentCategory) {
            throw new NotFoundException(`Parent category with ID ${parentId} not found.`);
        }

        const childCategories = createChildCategoriesDto.children.map((child) =>
            this.categoryRepository.create({
                categoryName: child.categoryName,
                parent: parentCategory,
            })
        );

        const savedCategories = await this.categoryRepository.save(childCategories);

        return savedCategories.map((category) => new CategoryResponseDtoBuilder().setValue(category).success().build());
    }

    async findAll(): Promise<CategoryResponseDto> {
        const categories = await this.categoryRepository.find({ relations: ['parent'] });
        return new CategoryResponseDtoBuilder().setValue(categories).success().build();
    }

    async findPrimaryCategories(pagination: PaginationDto): Promise<CategoryResponseDto> {
        try {
            const [entities, total] = await this.categoryRepository
                .createQueryBuilder('c')
                .leftJoinAndSelect('c.children', 'x')
                .where('c.parent IS NULL')
                .andWhere(pagination.options ? 'c.categoryName ILIKE :categoryName' : 'c.categoryName IS NOT NULL', {
                    categoryName: `${pagination.options}%`,
                })
                .orderBy('c.createdAt', pagination.order)
                .skip(pagination.skip)
                .take(pagination.take)
                .getManyAndCount();

            const meta = new PageMetaDto({
                pageOptionsDto: pagination,
                itemCount: total,
            });

            return new CategoryResponseDtoBuilder()
                .setValue(new PageDto<CategoryEntity>(entities, meta))
                .success()
                .build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async findOne(id: string): Promise<CategoryResponseDto> {
        const category = await this.categoryRepository.findOne({ where: { categoryId: id }, relations: ['parent'] });
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found.`);
        }
        return new CategoryResponseDtoBuilder().setValue(category).success().build();
    }

    async findChildren(parentId: string, pagination: PaginationDto): Promise<CategoryResponseDto> {
        try {
            const whereCondition = pagination.options
                ? { parent: { categoryId: parentId }, categoryName: ILike(`${pagination.options}%`) } // use ILike to perform a case-insensitive search
                : { parent: { categoryId: parentId } };

            const children = await this.categoryRepository.find({
                where: whereCondition,
                skip: (pagination.page - 1) * pagination.take,
                take: pagination.take,
                order: { createdAt: pagination.order },
                relations: ['parent'],
            });

            const meta = new PageMetaDto({
                pageOptionsDto: pagination,
                itemCount: 0,
            });

            return new CategoryResponseDtoBuilder()
                .success()
                .setValue(new PageDto<CategoryEntity>(children, meta))
                .build();
        } catch (error) {
            console.log(error);
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async findParent(id: string): Promise<CategoryResponseDto> {
        const category = await this.categoryRepository.findOne({
            where: { categoryId: id },
            relations: ['parent'],
        });
        if (!category || !category.parent) {
            throw new NotFoundException(`Parent category for category ID ${id} not found.`);
        }
        return new CategoryResponseDtoBuilder().setValue(category).success().build();
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto> {
        const category = await this.categoryRepository.findOne({ where: { categoryId: id } });
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found.`);
        }

        Object.assign(category, updateCategoryDto);
        await this.categoryRepository.save(category);
        return new CategoryResponseDtoBuilder().setValue(category).success().build();
    }

    async changeParent(id: string, parentId: string): Promise<CategoryResponseDto> {
        if (id === parentId) {
            throw new BadRequestException(`Category cannot be its own parent.`);
        }

        const category = await this.categoryRepository.findOne({ where: { categoryId: id } });
        if (!category) throw new NotFoundException(`Category with ID ${id} not found.`);

        const parentCategory = await this.categoryRepository.findOne({ where: { categoryId: parentId } });
        if (!parentCategory) throw new NotFoundException(`Parent category with ID ${parentId} not found.`);

        category.parent = parentCategory;
        await this.categoryRepository.save(category);
        return new CategoryResponseDtoBuilder().setValue(category).success().build();
    }

    async remove(id: string): Promise<void> {
        try {
            const category = await this.categoryRepository.findOne({ where: { categoryId: id } });
            if (!category) {
                throw new NotFoundException(`Category with ID ${id} not found.`);
            }
            await this.categoryRepository.remove(category);
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
    async findByIds(ids: string[]): Promise<CategoryEntity[]> {
        return this.categoryRepository.find({
            where: { categoryId: In(ids), isActive: true },
            select: {
                categoryId: true,
                categoryName: true,
                isActive: true,
            },
        });
    }

    async checkFamilyCategory(parentId: string, childId: string): Promise<boolean> {
        return this.categoryRepository.exists({ where: { parent: { categoryId: parentId }, categoryId: childId } });
    }
}
