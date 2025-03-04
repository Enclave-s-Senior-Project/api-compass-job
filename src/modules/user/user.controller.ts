import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Patch,
    Query,
    UploadedFiles,
    UseInterceptors,
    ValidationPipe,
} from '@nestjs/common';
import { UserService } from './service/user.service';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiInternalServerErrorResponse,
    ApiOperation,
    ApiProperty,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser, SkipAuth, TOKEN_NAME } from '@modules/auth';
import { JwtPayload, PaginationDto } from '@common/dtos';
import { UserResponseDto } from './dtos/user-response.dto';
import { CreateUserDto } from './dtos';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FileStorageConfig } from 'src/config/multer.config';
import { UpdatePersonalProfileDto } from './dtos/update-personal-profile.dto';
import { UpdateCandidateProfileDto } from './dtos/update-candidate-profile.dto';

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
    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ description: 'Update personal profile' })
    @Patch('personal')
    async updatePersonalProfile(@Body() body: UpdatePersonalProfileDto, @CurrentUser() user) {
        console.log('Body: ', body);
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
    // @HttpCode(200)
    // @ApiBearerAuth(TOKEN_NAME)
    // @ApiOperation({ description: 'Update user' })
    // @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    // @ApiInternalServerErrorResponse({ description: 'Server error' })
    // @Patch(':id')
    // async updateUser(
    //     @CurrentUser() user: JwtPayload,
    //     @Param('id') id: string,
    //     @Body(ValidationPipe) newUser: CreateUserDto
    // ) {
    //     return this.userService.updateUser(user, id, newUser);
    // }
}
