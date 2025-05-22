import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, ILike, In, Repository } from 'typeorm';
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
import { CategoryErrorType } from '@common/errors/category-error';
import { WarningException } from '@src/common/http/exceptions/warning.exception';

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
            throw new NotFoundException(CategoryErrorType.PARENT_CATEGORY_NOT_FOUND);
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
            throw new NotFoundException(CategoryErrorType.CATEGORY_NOT_FOUND);
        }
        return new CategoryResponseDtoBuilder().setValue(category).success().build();
    }

    async findChildren(parentId: string, pagination: PaginationDto): Promise<CategoryResponseDto> {
        try {
            const whereCondition = pagination.options
                ? { parent: { categoryId: parentId }, categoryName: ILike(`${pagination.options}%`) }
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
            throw new NotFoundException(CategoryErrorType.PARENT_CATEGORY_NOT_FOUND);
        }
        return new CategoryResponseDtoBuilder().setValue(category).success().build();
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto> {
        const category = await this.categoryRepository.findOne({ where: { categoryId: id } });
        if (!category) {
            throw new NotFoundException(CategoryErrorType.CATEGORY_NOT_FOUND);
        }

        Object.assign(category, updateCategoryDto);
        await this.categoryRepository.save(category);
        return new CategoryResponseDtoBuilder().setValue(category).success().build();
    }

    async changeParent(id: string, parentId: string): Promise<CategoryResponseDto> {
        if (id === parentId) {
            throw new BadRequestException(CategoryErrorType.CANNOT_BE_OWN_PARENT);
        }

        const category = await this.categoryRepository.findOne({ where: { categoryId: id } });
        if (!category) throw new NotFoundException(CategoryErrorType.CATEGORY_NOT_FOUND);

        const parentCategory = await this.categoryRepository.findOne({ where: { categoryId: parentId } });
        if (!parentCategory) throw new NotFoundException(CategoryErrorType.PARENT_CATEGORY_NOT_FOUND);

        category.parent = parentCategory;
        await this.categoryRepository.save(category);
        return new CategoryResponseDtoBuilder().setValue(category).success().build();
    }

    async remove(id: string): Promise<CategoryResponseDto> {
        try {
            let category = await this.categoryRepository.findOne({ where: { categoryId: id } });
            if (!category) {
                throw new NotFoundException(CategoryErrorType.CATEGORY_NOT_FOUND);
            }

            try {
                await this.categoryRepository.remove(category);
            } catch (error) {
                throw new WarningException(CategoryErrorType.CATEGORY_MAY_BE_IN_USE);
            }
            return new CategoryResponseDtoBuilder().success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async removeMany(ids: string[]): Promise<CategoryResponseDto> {
        try {
            let result: DeleteResult;
            try {
                result = await this.categoryRepository.delete({ categoryId: In(ids) });
            } catch (error) {
                throw new WarningException(CategoryErrorType.CATEGORY_MAY_BE_IN_USE);
            }
            if (!result.affected) {
                throw new NotFoundException(CategoryErrorType.CATEGORY_NOT_FOUND);
            }
            return new CategoryResponseDtoBuilder().success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async findByIds(ids: string[]): Promise<CategoryEntity[]> {
        if (!ids || ids.length === 0) {
            return [];
        }
        try {
            const result = await this.categoryRepository.find({
                where: { categoryId: In(ids) },
                select: {
                    categoryId: true,
                    categoryName: true,
                    isActive: true,
                },
            });

            return result;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async checkFamilyCategory(parentId: string, childId: string): Promise<boolean> {
        return this.categoryRepository.exists({ where: { parent: { categoryId: parentId }, categoryId: childId } });
    }

    async findPrimaryCategoriesEnterprise(
        pagination: PaginationDto,
        enterpriseId: string
    ): Promise<CategoryResponseDto> {
        try {
            const queryBuilder = this.categoryRepository
                .createQueryBuilder('c')
                .innerJoin('enterprises', 'e', 'e.enterprise_id = :enterpriseId', { enterpriseId })
                .where('c.category_id = ANY(e.categories::uuid[])')
                .andWhere('c.parent IS NULL');

            if (pagination.options) {
                queryBuilder.andWhere('c.categoryName ILIKE :categoryName', {
                    categoryName: `${pagination.options}%`,
                });
            }

            queryBuilder.orderBy('c.createdAt', pagination.order).skip(pagination.skip).take(pagination.take);

            const [entities, total] = await queryBuilder.getManyAndCount();

            const meta = new PageMetaDto({
                pageOptionsDto: pagination,
                itemCount: total,
            });

            return new CategoryResponseDtoBuilder()
                .setValue(new PageDto<CategoryEntity>(entities, meta))
                .success()
                .build();
        } catch (error) {
            console.log(error);
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
