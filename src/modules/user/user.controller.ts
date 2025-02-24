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
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                avatar: {
                    type: 'string',
                    format: 'binary',
                    description: 'First image file (max 2MB)',
                },
                background: {
                    type: 'string',
                    format: 'binary',
                    description: 'Second image file (max 5MB)',
                },
                education: {
                    type: 'string',
                    example: 'Bachelor of Science, Computer Science',
                },
                experience: {
                    type: 'string',
                    example: '5 years of experience',
                },
                phone: {
                    type: 'string',
                    example: '+123 45 6789',
                },
            },
            required: ['avatar', 'background'],
        },
    })
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                {
                    name: 'avatar',
                    maxCount: 1,
                },
                { name: 'background', maxCount: 1 },
            ],
            new FileStorageConfig(5).getMulterOptions(['avatar', 'background'])
        )
    )
    @Patch('personal')
    async updatePersonalProfile(
        @UploadedFiles() files: { avatar: Express.Multer.File[]; background: Express.Multer.File[] },
        @Body() body: UpdatePersonalProfileDto,
        @CurrentUser() user
    ) {
        return this.userService.updatePersonalProfile(files, body, user);
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
