// tag.controller.ts
import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Post,
    Delete,
    ValidationPipe,
    Query,
    UseGuards,
    Put,
} from '@nestjs/common';
import { TagService } from './services';
import {
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiNotFoundResponse,
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiQuery,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { TagResponseDto, CreateTagDto, UpdateTagDto } from './dtos/';
import { DeleteTagsDto } from './dtos/delete-tags.dto';
import { SkipAuth, TOKEN_NAME } from '@modules/auth';
import { PaginationDto } from '@common/dtos';
import { GetTagsByNameDto } from './dtos/filter-tag.dto';
import { RolesGuard } from '../auth/guards/role.guard';
import { Role, Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Tag')
@Controller({
    path: 'tag',
    version: '1',
})
export class TagController {
    constructor(private readonly tagService: TagService) {}

    @SkipAuth()
    @Get('filter')
    @HttpCode(200)
    @ApiOperation({ description: 'Get Tags by Names' })
    @ApiOkResponse({ description: 'Tags retrieved successfully.', type: TagResponseDto, isArray: true })
    @ApiBadRequestResponse({ description: 'Invalid IDs.' })
    @ApiInternalServerErrorResponse({ description: 'Server error.' })
    getTagsByName(@Query() query: GetTagsByNameDto): Promise<TagResponseDto> {
        return this.tagService.findByName(query.name);
    }

    @SkipAuth()
    @Post()
    @HttpCode(201)
    @ApiOperation({ summary: 'Create Tag', description: 'Create a new Tag.' })
    @ApiCreatedResponse({ description: 'Tag created successfully.', type: TagResponseDto })
    @ApiBadRequestResponse({ description: 'Invalid Tag data.' })
    @ApiInternalServerErrorResponse({ description: 'Server error.' })
    createTag(@Body() createTagDto: CreateTagDto[]): Promise<TagResponseDto> {
        return this.tagService.create(createTagDto);
    }

    @SkipAuth()
    @Get()
    @HttpCode(200)
    @ApiOperation({ summary: 'Get all Tags', description: 'Retrieve all Tags without pagination.' })
    @ApiOkResponse({ description: 'Tags retrieved successfully.', type: TagResponseDto, isArray: true })
    @ApiQuery({ name: 'name', required: false, description: 'Tên của tag', schema: { default: '' } })
    @ApiInternalServerErrorResponse({ description: 'Server error.' })
    getAllTags(@Query() pageOptionsDto: PaginationDto, @Query('name') name?: string): Promise<TagResponseDto> {
        return this.tagService.findAll(pageOptionsDto, name);
    }

    @SkipAuth()
    @Get(':id')
    @HttpCode(200)
    @ApiOperation({ summary: 'Get Tag by ID', description: 'Retrieve a single Tag by its ID.' })
    @ApiOkResponse({ description: 'Tag retrieved successfully.', type: TagResponseDto })
    @ApiNotFoundResponse({ description: 'Tag not found.' })
    @ApiInternalServerErrorResponse({ description: 'Server error.' })
    getTagById(@Param('id') id: string): Promise<TagResponseDto> {
        return this.tagService.findOne(id);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Put(':id')
    @HttpCode(200)
    @ApiOperation({ summary: 'Update Tag', description: 'Update an existing Tag by its ID.' })
    @ApiOkResponse({ description: 'Tag updated successfully.', type: TagResponseDto })
    @ApiBadRequestResponse({ description: 'Invalid update data.' })
    @ApiNotFoundResponse({ description: 'Tag not found.' })
    @ApiInternalServerErrorResponse({ description: 'Server error.' })
    updateTag(@Param('id') id: string, @Body(ValidationPipe) updateTagDto: UpdateTagDto): Promise<TagResponseDto> {
        return this.tagService.update(id, updateTagDto);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete Tag', description: 'Remove a Tag by its ID.' })
    @ApiNoContentResponse({ description: 'Tag deleted successfully.' })
    @ApiNotFoundResponse({ description: 'Tag not found.' })
    @ApiInternalServerErrorResponse({ description: 'Server error.' })
    deleteTag(@Param('id') id: string) {
        return this.tagService.remove(id);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Delete()
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete Multiple Tags', description: 'Remove multiple tags by their IDs.' })
    @ApiNoContentResponse({ description: 'Tags deleted successfully.' })
    @ApiNotFoundResponse({ description: 'One or more tags not found.' })
    @ApiBadRequestResponse({ description: 'Invalid tag IDs.' })
    @ApiInternalServerErrorResponse({ description: 'Server error.' })
    deleteManyTags(@Body() deleteTagsDto: DeleteTagsDto) {
        return this.tagService.removeBulk(deleteTagsDto.tagIds);
    }
}
