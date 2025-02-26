import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { WebsiteService } from './services';
import { CreateWebsiteDto } from './dtos/create-website.dto';
import { UpdateWebsiteDto } from './dtos/update-website.dto';
import {
    ApiTags,
    ApiOperation,
    ApiParam,
    ApiOkResponse,
    ApiInternalServerErrorResponse,
    ApiBearerAuth,
    ApiBody,
    ApiResponse,
} from '@nestjs/swagger';
import { CurrentUser, SkipAuth, TOKEN_NAME } from '@modules/auth';
import { TagResponseDto } from '@modules/tag/dtos';
import { JwtPayload, PaginationDto } from '@common/dtos';
import { WebsiteResponseDto } from './dtos';
import { UserDto } from '@modules/user/dtos/user.dto';
import { SocialType } from '@database/entities';

@ApiTags('Website')
@Controller('website')
export class WebsiteController {
    constructor(private readonly websiteService: WebsiteService) {}

    // @SkipAuth()
    @ApiBearerAuth(TOKEN_NAME)
    @Post()
    @ApiOperation({ summary: 'Create a new website' })
    create(@Body() createWebsiteDto: CreateWebsiteDto, @CurrentUser() user: UserDto) {
        console.log('user', user);
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
    @ApiBearerAuth(TOKEN_NAME)
    @Post('/profile')
    @ApiOperation({
        summary: 'Create a website by profile ID',
        description: "Creates a new website associated with the authenticated user's profile ID.",
    })
    @ApiBody({
        type: [CreateWebsiteDto], // Specify an array of CreateWebsiteDto
        description: 'Array of website creation data',
        examples: {
            multipleWebsites: {
                summary: 'Example of creating multiple websites',
                value: [
                    {
                        socialType: SocialType.FACEBOOK,
                        socialLink: 'https://www.facebook.com/example',
                    },
                    {
                        socialType: SocialType.TWITTER,
                        socialLink: 'https://twitter.com/example',
                    },
                ],
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Website created successfully',
        type: WebsiteResponseDto,
    })
    createWebsiteByProfileId(
        @Body() createWebsiteDto: CreateWebsiteDto[],
        @CurrentUser() user: JwtPayload
    ): Promise<WebsiteResponseDto> {
        return this.websiteService.createWebsitesByProfileId(createWebsiteDto, user);
    }

    @SkipAuth()
    @Get('/profile/:profileId')
    @ApiOperation({
        summary: 'Get websites by profile ID',
        description: 'Retrieves all websites associated with the specified profile ID.',
    })
    @ApiParam({
        name: 'profileId',
        description: 'UUID of the profile to fetch websites for',
        example: 'a3b9e1b2-f97a-4380-a30a-785f4d91fef1',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'List of websites retrieved successfully',
    })
    findByProfileId(@Param('profileId') profileId: string) {
        return this.websiteService.findByProfileId(profileId);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @Post('/enterprise')
    @ApiOperation({
        summary: 'Create a website by enterprise ID',
        description: "Creates a new website associated with the authenticated user's enterprise ID.",
    })
    @ApiBody({
        type: [CreateWebsiteDto], // Specify an array of CreateWebsiteDto
        description: 'Array of website creation data',
        examples: {
            multipleWebsites: {
                summary: 'Example of creating multiple websites',
                value: [
                    {
                        socialType: SocialType.FACEBOOK,
                        socialLink: 'https://www.facebook.com/example',
                    },
                    {
                        socialType: SocialType.TWITTER,
                        socialLink: 'https://twitter.com/example',
                    },
                ],
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Website created successfully',
        type: WebsiteResponseDto,
    })
    createWebsiteByEnterpriseId(
        @Body() createWebsiteDto: CreateWebsiteDto,
        @CurrentUser() user: JwtPayload
    ): Promise<WebsiteResponseDto> {
        return this.websiteService.createWebsiteByEnterpriseId(createWebsiteDto, user);
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
