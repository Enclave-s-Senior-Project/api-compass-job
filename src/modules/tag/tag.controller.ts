// tag.controller.ts
import { Body, Controller, Get, HttpCode, Param, Patch, Post, Delete, ValidationPipe, Query } from '@nestjs/common';
import { TagService } from './services';
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
} from '@nestjs/swagger';
import { TagResponseDto, CreateTagDto, UpdateTagDto } from './dtos/';
import { SkipAuth } from '@modules/auth';
import { PaginationDto } from '@common/dtos';

@ApiTags('Tag')
@Controller({
    path: 'tag',
    version: '1',
})
export class TagController {
    constructor(private readonly tagService: TagService) {}

    @SkipAuth()
    @Post()
    @HttpCode(201)
    @ApiOperation({ summary: 'Create Tag', description: 'Create a new Tag.' })
    @ApiCreatedResponse({ description: 'Tag created successfully.', type: TagResponseDto })
    @ApiBadRequestResponse({ description: 'Invalid Tag data.' })
    @ApiInternalServerErrorResponse({ description: 'Server error.' })
    async createTag(@Body(ValidationPipe) createTagDto: CreateTagDto[]): Promise<TagResponseDto> {
        return this.tagService.create(createTagDto);
    }

    @SkipAuth()
    @Get()
    @HttpCode(200)
    @ApiOperation({ summary: 'Get all Tags', description: 'Retrieve all Tags without pagination.' })
    @ApiOkResponse({ description: 'Tags retrieved successfully.', type: TagResponseDto, isArray: true })
    @ApiInternalServerErrorResponse({ description: 'Server error.' })
    async getAllTags(@Query() pageOptionsDto: PaginationDto): Promise<TagResponseDto> {
        return this.tagService.findAll(pageOptionsDto);
    }

    @SkipAuth()
    @Get(':id')
    @HttpCode(200)
    @ApiOperation({ summary: 'Get Tag by ID', description: 'Retrieve a single Tag by its ID.' })
    @ApiOkResponse({ description: 'Tag retrieved successfully.', type: TagResponseDto })
    @ApiNotFoundResponse({ description: 'Tag not found.' })
    @ApiInternalServerErrorResponse({ description: 'Server error.' })
    async getTagById(@Param('id') id: string): Promise<TagResponseDto> {
        return this.tagService.findOne(id);
    }

    @SkipAuth()
    @Patch(':id')
    @HttpCode(200)
    @ApiOperation({ summary: 'Update Tag', description: 'Update an existing Tag by its ID.' })
    @ApiOkResponse({ description: 'Tag updated successfully.', type: TagResponseDto })
    @ApiBadRequestResponse({ description: 'Invalid update data.' })
    @ApiNotFoundResponse({ description: 'Tag not found.' })
    @ApiInternalServerErrorResponse({ description: 'Server error.' })
    async updateTag(
        @Param('id') id: string,
        @Body(ValidationPipe) updateTagDto: UpdateTagDto
    ): Promise<TagResponseDto> {
        return this.tagService.update(id, updateTagDto);
    }

    @SkipAuth()
    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete Tag', description: 'Remove a Tag by its ID.' })
    @ApiNoContentResponse({ description: 'Tag deleted successfully.' })
    @ApiNotFoundResponse({ description: 'Tag not found.' })
    @ApiInternalServerErrorResponse({ description: 'Server error.' })
    async deleteTag(@Param('id') id: string): Promise<void> {
        return this.tagService.remove(id);
    }
}
