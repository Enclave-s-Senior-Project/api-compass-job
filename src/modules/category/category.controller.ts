import { Body, Controller, Get, HttpCode, Param, Patch, Post, Delete, Query, ValidationPipe } from '@nestjs/common';
import { CategoryService } from './services';
import {
    ApiBearerAuth,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
    ApiNotFoundResponse,
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiQuery,
} from '@nestjs/swagger';
import { CategoryResponseDto, CreateCategoryDto, CreateChildCategoriesDto, UpdateCategoryDto } from './dtos';
import { SkipAuth } from '@modules/auth';
import { PaginationDto } from '@common/dtos';

@ApiTags('Category')
@Controller({
    path: 'category',
    version: '1',
})
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @SkipAuth()
    @Post()
    @HttpCode(201)
    @ApiOperation({ summary: 'Create root category', description: 'Create a new root category without a parent.' })
    @ApiCreatedResponse({ description: 'Category created successfully.', type: CategoryResponseDto })
    @ApiBadRequestResponse({ description: 'Invalid category data.' })
    async createCategory(@Body(ValidationPipe) createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
        return this.categoryService.create(createCategoryDto);
    }

    @SkipAuth()
    @Post(':parentId/children')
    @HttpCode(201)
    @ApiOperation({
        summary: 'Create multiple child categories',
        description: 'Create multiple child categories under a parent category.',
    })
    @ApiCreatedResponse({ description: 'Child categories created successfully.', type: [CategoryResponseDto] })
    @ApiBadRequestResponse({ description: 'Invalid data or parent category not found.' })
    async createChildCategories(
        @Param('parentId') parentId: string,
        @Body(ValidationPipe) createChildCategoriesDto: CreateChildCategoriesDto
    ): Promise<CategoryResponseDto[]> {
        return this.categoryService.createChildCategories(parentId, createChildCategoriesDto);
    }
    @SkipAuth()
    @Get()
    @HttpCode(200)
    @ApiOperation({ summary: 'Get all categories', description: 'Retrieve all categories without pagination.' })
    @ApiOkResponse({ description: 'Categories retrieved successfully.', type: [CategoryResponseDto] })
    async getAllCategories(): Promise<CategoryResponseDto> {
        return this.categoryService.findAll();
    }

    @SkipAuth()
    @Get('/primary')
    @HttpCode(200)
    @ApiOperation({
        summary: 'Get primary categories',
        description: 'Retrieve all primary (industry) categories without pagination.',
    })
    @ApiOkResponse({ description: 'Primary categories retrieved successfully.', type: [CategoryResponseDto] })
    async getPrimaryCategories(@Query() pagination: PaginationDto): Promise<CategoryResponseDto> {
        return this.categoryService.findPrimaryCategories(pagination);
    }

    @SkipAuth()
    @Get(':id')
    @HttpCode(200)
    @ApiOperation({ summary: 'Get category by ID', description: 'Retrieve a category by its ID.' })
    @ApiOkResponse({ description: 'Category retrieved successfully.', type: CategoryResponseDto })
    @ApiNotFoundResponse({ description: 'Category not found.' })
    async getCategoryById(@Param('id') id: string): Promise<CategoryResponseDto> {
        return this.categoryService.findOne(id);
    }

    @SkipAuth()
    @Get(':parentId/children')
    @HttpCode(200)
    @ApiOperation({ summary: 'Get child categories', description: 'Retrieve child categories of a parent category.' })
    @ApiOkResponse({ description: 'Child categories retrieved successfully.', type: [CategoryResponseDto] })
    async getChildCategories(
        @Param('parentId') parentId: string,
        @Query() pagination: PaginationDto
    ): Promise<CategoryResponseDto> {
        return this.categoryService.findChildren(parentId, pagination);
    }

    @SkipAuth()
    @Get(':id/parent')
    @HttpCode(200)
    @ApiOperation({ summary: 'Get parent category', description: 'Retrieve the parent of a category.' })
    @ApiOkResponse({ description: 'Parent category retrieved successfully.', type: CategoryResponseDto })
    @ApiNotFoundResponse({ description: 'Parent category not found.' })
    async getParentCategory(@Param('id') id: string): Promise<CategoryResponseDto> {
        return this.categoryService.findParent(id);
    }

    @SkipAuth()
    @Patch(':id')
    @HttpCode(200)
    @ApiOperation({ summary: 'Update category', description: 'Update a category by its ID.' })
    @ApiOkResponse({ description: 'Category updated successfully.', type: CategoryResponseDto })
    @ApiBadRequestResponse({ description: 'Invalid data.' })
    @ApiNotFoundResponse({ description: 'Category not found.' })
    async updateCategory(
        @Param('id') id: string,
        @Body(ValidationPipe) updateCategoryDto: UpdateCategoryDto
    ): Promise<CategoryResponseDto> {
        return this.categoryService.update(id, updateCategoryDto);
    }

    @SkipAuth()
    @Patch(':id/parent')
    @HttpCode(200)
    @ApiOperation({ summary: 'Change parent category', description: 'Change the parent category of a category.' })
    @ApiOkResponse({ description: 'Parent category updated successfully.', type: CategoryResponseDto })
    @ApiBadRequestResponse({ description: 'Invalid parent category ID.' })
    async changeParentCategory(
        @Param('id') id: string,
        @Body('parentId', ValidationPipe) parentId: string
    ): Promise<CategoryResponseDto> {
        return this.categoryService.changeParent(id, parentId);
    }

    @SkipAuth()
    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete category', description: 'Remove a category by its ID.' })
    @ApiNoContentResponse({ description: 'Category deleted successfully.' })
    @ApiNotFoundResponse({ description: 'Category not found.' })
    async deleteCategory(@Param('id') id: string): Promise<void> {
        return this.categoryService.remove(id);
    }
}
