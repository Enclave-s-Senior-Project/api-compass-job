import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { UserService } from './service/user.service';
import {
    ApiBearerAuth,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { TOKEN_NAME } from '@modules/auth';
import { PageDto, PaginationDto } from '@common/dtos';
import { UserDto } from './dtos/user.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { ProfileFilterDto } from './dtos/user-filter-dto';

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
    async filterUsers(
        @Query() pageOptionsDto: PaginationDto,
        @Query('q') query: ProfileFilterDto
    ): Promise<UserResponseDto> {
        console.log('pageOptionsDto', pageOptionsDto);
        console.log('query', query);
        return this.userService.filterUsers(pageOptionsDto, query);
    }
}
