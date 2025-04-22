import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    Delete,
    Query,
    ValidationPipe,
    UseGuards,
    Put,
} from '@nestjs/common';
import { CategoryService } from './services';
import {
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiNotFoundResponse,
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoryResponseDto, CreateCategoryDto, CreateChildCategoriesDto, UpdateCategoryDto } from './dtos';
import { SkipAuth, TOKEN_NAME } from '@modules/auth';
import { PaginationDto } from '@common/dtos';
import { RolesGuard } from '../auth/guards/role.guard';
import { Role, Roles } from '../auth/decorators/roles.decorator';
import { ChangeParentDto } from './dtos/change-parent.dto';

@ApiTags('Category')
@Controller({
    path: 'category',
    version: '1',
})
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @ApiBearerAuth(TOKEN_NAME)
    @HttpCode(201)
    @ApiOperation({ summary: 'Create root category', description: 'Create a new root category without a parent.' })
    @ApiCreatedResponse({ description: 'Category created successfully.', type: CategoryResponseDto })
    @ApiBadRequestResponse({ description: 'Invalid category data.' })
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Post()
    async createCategory(@Body(ValidationPipe) createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
        return this.categoryService.create(createCategoryDto);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @HttpCode(201)
    @ApiOperation({
        summary: 'Create multiple child categories',
        description: 'Create multiple child categories under a parent category.',
    })
    @ApiCreatedResponse({ description: 'Child categories created successfully.', type: [CategoryResponseDto] })
    @ApiBadRequestResponse({ description: 'Invalid data or parent category not found.' })
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Post(':parentId/children')
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

    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ summary: 'Update category', description: 'Update a category by its ID.' })
    @ApiOkResponse({ description: 'Category updated successfully.', type: CategoryResponseDto })
    @ApiBadRequestResponse({ description: 'Invalid data.' })
    @ApiNotFoundResponse({ description: 'Category not found.' })
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Put(':id')
    async updateCategory(
        @Param('id') id: string,
        @Body(ValidationPipe) updateCategoryDto: UpdateCategoryDto
    ): Promise<CategoryResponseDto> {
        return this.categoryService.update(id, updateCategoryDto);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ summary: 'Change parent category', description: 'Change the parent category of a category.' })
    @ApiOkResponse({ description: 'Parent category updated successfully.', type: CategoryResponseDto })
    @ApiBadRequestResponse({ description: 'Invalid parent category ID.' })
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id/parent')
    async changeParentCategory(@Param('id') id: string, @Body() body: ChangeParentDto): Promise<CategoryResponseDto> {
        return this.categoryService.changeParent(id, body.parentId);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ summary: 'Delete category', description: 'Remove a category by its ID.' })
    @ApiNoContentResponse({ description: 'Category deleted successfully.' })
    @ApiNotFoundResponse({ description: 'Category not found.' })
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id')
    async deleteCategory(@Param('id') id: string): Promise<void> {
        return this.categoryService.remove(id);
    }
}
