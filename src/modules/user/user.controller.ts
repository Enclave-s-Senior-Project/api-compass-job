import { Body, Controller, Get, HttpCode, Param, Patch, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { UserService } from './service/user.service';
import {
    ApiBearerAuth,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, SkipAuth, TOKEN_NAME } from '@modules/auth';
import { JwtPayload, PageDto, PaginationDto } from '@common/dtos';
import { UserDto } from './dtos/user.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { ProfileFilterDto } from './dtos/user-filter-dto';
import { CreateUserDto, UpdateUserDto } from './dtos';

@ApiTags('User')
@Controller({
    path: 'user',
    version: '1',
})
@ApiBearerAuth(TOKEN_NAME)
export class UserController {
    constructor(private readonly userService: UserService) {}

    @HttpCode(200)
    @ApiOperation({ description: 'Get all users with pagination' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get()
    async getAllUsers(@Query() pageOptionsDto: PaginationDto): Promise<UserResponseDto> {
        return this.userService.getAllUsers(pageOptionsDto);
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
    @ApiBearerAuth(TOKEN_NAME)
    @HttpCode(200)
    @ApiOperation({ description: 'Update user' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Patch(':id')
    async updateUser(
        @CurrentUser() user: JwtPayload,
        @Param('id') id: string,
        @Body(ValidationPipe) newUser: CreateUserDto
    ) {
        return this.userService.updateUser(user, id, newUser);
    }
}
