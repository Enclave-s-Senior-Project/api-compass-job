import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    CategoryResponseDto,
    CategoryResponseDtoBuilder,
    CreateCategoryDto,
    CreateChildCategoriesDto,
    UpdateCategoryDto,
} from '../dtos';
import { PaginationDto } from '@common/dtos';
import { CategoryEntity } from '@database/entities';

@Injectable()
export class CategoryService {
    constructor(
        @InjectRepository(CategoryEntity)
        private readonly categoryRepository: Repository<CategoryEntity>
    ) {}

    async create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
        const category = this.categoryRepository.create(createCategoryDto);
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

    async findPrimaryCategories(): Promise<CategoryResponseDto> {
        const primaryCategories = await this.categoryRepository.find({
            where: { parent: null },
            relations: ['parent'],
        });
        return new CategoryResponseDtoBuilder().setValue(primaryCategories).success().build();
    }

    async findOne(id: string): Promise<CategoryResponseDto> {
        const category = await this.categoryRepository.findOne({ where: { categoryId: id }, relations: ['parent'] });
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found.`);
        }
        return new CategoryResponseDtoBuilder().setValue(category).success().build();
    }

    async findChildren(parentId: string): Promise<CategoryResponseDto> {
        const children = await this.categoryRepository.find({
            where: { parent: { categoryId: parentId } },
            relations: ['parent'],
        });
        return new CategoryResponseDtoBuilder().setValue(children).success().build();
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
        const category = await this.categoryRepository.findOne({ where: { categoryId: id } });
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found.`);
        }
        await this.categoryRepository.remove(category);
    }
}
