import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Patch,
    Query,
    UploadedFile,
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
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser, SkipAuth, TOKEN_NAME } from '@modules/auth';
import { JwtPayload, PaginationDto } from '@common/dtos';
import { UserResponseDto } from './dtos/user-response.dto';
import { CreateUserDto } from './dtos';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileStorageConfig } from 'src/config/multer.config';
import { UpdatePersonalProfileDto } from './dtos/update-personal-profile.dto';

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
    @SkipAuth()
    // @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ description: 'Update personal profile' })
    @ApiConsumes('multipart/form-data')
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @ApiBody({
        description: 'Upload multiple images under "images" field',
        schema: {
            type: 'object',
            properties: {
                images: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('images', new FileStorageConfig(2).getMulterOptions()))
    @Patch('personal')
    async updatePersonalProfile(
        @UploadedFiles() files: Express.Multer.File[]
        // @Body() body: UpdatePersonalProfileDto,
        // @CurrentUser() user
    ) {
        // return this.userService.updatePersonalProfile(files, body, user);
        console.log(files);
        return files;
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
