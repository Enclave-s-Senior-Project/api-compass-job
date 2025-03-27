import { Body, Controller, Get, HttpCode, Param, Patch, Query, Req } from '@nestjs/common';
import { UserService } from './service/user.service';
import {
    ApiBearerAuth,
    ApiInternalServerErrorResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser, SkipAuth, TOKEN_NAME } from '@modules/auth';
import { PaginationDto } from '@common/dtos';
import { UserResponseDto } from './dtos/user-response.dto';
import { UpdatePersonalProfileDto } from './dtos/update-personal-profile.dto';
import { UpdateCandidateProfileDto } from './dtos/update-candidate-profile.dto';
import { FilterCandidatesProfileDto } from './dtos/filter-candidate.dto';
import { CvService } from '../cv/services/cv.service';
import { WebsiteService } from '../website/services';

@ApiTags('User')
@Controller({
    path: 'user',
    version: '1',
})
@ApiBearerAuth(TOKEN_NAME)
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly cvService: CvService,
        private readonly websiteService: WebsiteService
    ) {}

    @HttpCode(200)
    @ApiOperation({ description: 'Get all users with pagination' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get()
    async getAllUsers(@Query() pageOptionsDto: PaginationDto): Promise<UserResponseDto> {
        return this.userService.getAllUsers(pageOptionsDto);
    }

    @HttpCode(200)
    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ description: 'Update personal profile' })
    @Patch('personal')
    async updatePersonalProfile(@Body() body: UpdatePersonalProfileDto, @CurrentUser() user) {
        return this.userService.updatePersonalProfile(body, user);
    }

    @HttpCode(200)
    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ description: 'Update user' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Patch('candidate')
    async updateCandidateProfile(@Body() body: UpdateCandidateProfileDto, @CurrentUser() user) {
        return this.userService.updateCandidateProfile(body, user);
    }

    @HttpCode(200)
    @ApiOperation({ description: 'Filter users' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get('filter')
    async filterUsers(@Query() pageOptionsDto: PaginationDto): Promise<UserResponseDto> {
        return this.userService.filterUsers(pageOptionsDto);
    }

    @HttpCode(200)
    @SkipAuth()
    @ApiOperation({ description: 'Get all candidate with pagination' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get('candidate')
    async getAllCandidate(
        @Query() pageOptionsDto: FilterCandidatesProfileDto,
        @Req() req: Request
    ): Promise<UserResponseDto> {
        pageOptionsDto.industryId = Array.isArray(pageOptionsDto.industryId)
            ? pageOptionsDto.industryId
            : pageOptionsDto.industryId
              ? [pageOptionsDto.industryId]
              : undefined;
        return this.userService.getAllCandidate(pageOptionsDto, req.url);
    }

    @SkipAuth()
    @HttpCode(200)
    @ApiOperation({ description: 'Get user information by ID profile' })
    @ApiParam({ name: 'id', description: 'The ID of the user profile', required: true, type: String })
    @Get(':id')
    async getUserInfo(@Param('id') profileId: string) {
        return this.userService.getUserByProfileId(profileId);
    }

    @SkipAuth()
    @HttpCode(200)
    @Get(':id/resume')
    @ApiOperation({ description: 'Get resume by ID profile' })
    @ApiParam({ name: 'id', description: 'The ID of the user profile', required: true, type: String })
    async getUserResume(@Param('id') profileId: string) {
        return this.cvService.getCvByUserId(profileId);
    }

    @SkipAuth()
    @HttpCode(200)
    @ApiOperation({ description: 'Get social links by ID profile' })
    @ApiParam({ name: 'id', description: 'The ID of the user profile', required: true, type: String })
    @Get(':id/social-link')
    async getSocialLinks(@Param('id') profileId: string) {
        return this.websiteService.findByProfileId(profileId);
    }
}
