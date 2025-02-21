import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { WebsiteService } from './services';
import { CreateWebsiteDto } from './dtos/create-website.dto';
import { UpdateWebsiteDto } from './dtos/update-website.dto';
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { SkipAuth } from '@modules/auth';
import { TagResponseDto } from '@modules/tag/dtos';
import { PaginationDto } from '@common/dtos';
import { WebsiteResponseDto } from './dtos';

@ApiTags('Website')
@Controller('website')
export class WebsiteController {
    constructor(private readonly websiteService: WebsiteService) {}

    @SkipAuth()
    @Post()
    @ApiOperation({ summary: 'Create a new website' })
    create(@Body() createWebsiteDto: CreateWebsiteDto) {
        return this.websiteService.create(createWebsiteDto);
    }

    @SkipAuth()
    @Get()
    @ApiOperation({ summary: 'Get all websites' })
    @ApiOkResponse({ description: 'Tags retrieved successfully.', type: TagResponseDto, isArray: true })
    @ApiInternalServerErrorResponse({ description: 'Server error.' })
    findAll(@Query() pageOptionsDto: PaginationDto): Promise<WebsiteResponseDto> {
        return this.websiteService.findAll(pageOptionsDto);
    }

    @SkipAuth()
    @Get(':id')
    @ApiOperation({ summary: 'Get a website by its ID' })
    @ApiParam({ name: 'id', description: 'UUID of the website', example: 'f9a74c91-6ebf-4d92-8b57-d4d9cacf8abc' })
    findOne(@Param('id') id: string) {
        return this.websiteService.findOne(id);
    }

    @SkipAuth()
    @Patch(':id')
    @ApiOperation({ summary: 'Update a website by its ID' })
    @ApiParam({ name: 'id', description: 'UUID of the website', example: 'f9a74c91-6ebf-4d92-8b57-d4d9cacf8abc' })
    update(@Param('id') id: string, @Body() updateWebsiteDto: UpdateWebsiteDto) {
        return this.websiteService.update(id, updateWebsiteDto);
    }

    @SkipAuth()
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a website by its ID' })
    @ApiParam({ name: 'id', description: 'UUID of the website', example: 'f9a74c91-6ebf-4d92-8b57-d4d9cacf8abc' })
    remove(@Param('id') id: string) {
        return this.websiteService.remove(id);
    }

    @SkipAuth()
    @Get('/profile/:profileId')
    @ApiOperation({ summary: 'Get websites by profile ID' })
    @ApiParam({
        name: 'profileId',
        description: 'UUID of the profile',
        example: 'a3b9e1b2-f97a-4380-a30a-785f4d91fef1',
    })
    findByProfileId(@Param('profileId') profileId: string) {
        return this.websiteService.findByProfileId(profileId);
    }

    @SkipAuth()
    @Get('/enterprise/:enterpriseId')
    @ApiOperation({ summary: 'Get websites by enterprise ID' })
    @ApiParam({
        name: 'enterpriseId',
        description: 'UUID of the enterprise',
        example: 'e7a5f91c-c450-426f-b1b4-870e0d17f5d8',
    })
    findByEnterpriseId(@Param('enterpriseId') enterpriseId: string) {
        return this.websiteService.findByEnterpriseId(enterpriseId);
    }
}
