import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Put,
    Query,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRatingService } from './services/user-rating.service';
import { CreateUserRatingDto } from './dtos/create-user-rating.dto';
import { UpdateUserRatingDto } from './dtos/update-user-rating.dto';
import { UserRatingResponseDto } from './dtos/user-rating-response.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { JwtPayload, PaginationDto } from '@common/dtos';
import { CurrentUser, SkipAuth, TOKEN_NAME } from '@modules/auth';
import { RolesGuard } from '../auth/guards/role.guard';
import { Role, Roles } from '../auth/decorators/roles.decorator';
import { ReviewSummaryResponseDto } from './dtos/review-summary-response.dto';

@ApiTags('User Ratings')
@Controller({
    path: 'user-ratings',
    version: '1',
})
export class UserRatingController {
    constructor(private readonly userRatingService: UserRatingService) {}
    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.USER, Role.ENTERPRISE)
    @Post()
    @ApiOperation({ summary: 'Create a new rating' })
    @ApiResponse({ status: 201, type: UserRatingResponseDto })
    async create(
        @Body() createDto: CreateUserRatingDto,
        @CurrentUser() user: JwtPayload
    ): Promise<UserRatingResponseDto> {
        return await this.userRatingService.create(createDto, user.profileId);
    }
    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.USER, Role.ENTERPRISE)
    @Patch(':id')
    @ApiOperation({ summary: 'Update a rating' })
    @ApiResponse({ status: 200, type: UserRatingResponseDto })
    async update(
        @Param('id') id: string,
        @Body(ValidationPipe) updateDto: UpdateUserRatingDto,
        @CurrentUser() user: JwtPayload
    ): Promise<UserRatingResponseDto> {
        return await this.userRatingService.update(id, updateDto, user.profileId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a rating' })
    @ApiResponse({ status: 204 })
    async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<void> {
        await this.userRatingService.delete(id, user.profileId);
    }

    @SkipAuth()
    @Get(':id')
    @ApiOperation({ summary: 'Get a rating by ID' })
    @ApiResponse({ status: 200, type: UserRatingResponseDto })
    async getById(@Param('id') id: string): Promise<UserRatingResponseDto> {
        return await this.userRatingService.getById(id);
    }
    @SkipAuth()
    @Get('enterprise/:enterpriseId/average')
    @ApiOperation({ summary: 'Get average rating for an enterprise' })
    @ApiResponse({ status: 200, type: Number })
    async getAverageRatingByEnterprise(@Param('enterpriseId') enterpriseId: string): Promise<UserRatingResponseDto> {
        return await this.userRatingService.getAverageRatingByEnterprise(enterpriseId);
    }
    @SkipAuth()
    @Get('enterprise/:enterpriseId/summary')
    @ApiOperation({ summary: 'Get review summary for an enterprise' })
    @ApiResponse({ status: 200, type: ReviewSummaryResponseDto })
    async getReviewSummaryByEnterprise(@Param('enterpriseId') enterpriseId: string): Promise<UserRatingResponseDto> {
        return await this.userRatingService.getReviewSummaryByEnterprise(enterpriseId);
    }
    @SkipAuth()
    @Get('enterprise/:enterpriseId')
    @ApiOperation({ summary: 'Get ratings for an enterprise' })
    @ApiResponse({ status: 200, type: [UserRatingResponseDto] })
    async getByEnterprise(
        @Param('enterpriseId') enterpriseId: string,
        @Query() pageOptionsDto: PaginationDto
    ): Promise<UserRatingResponseDto> {
        return await this.userRatingService.getByEnterprise(enterpriseId, pageOptionsDto);
    }
}
