import { CvService } from './services/cv.service';
import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, UseGuards, Put, Query } from '@nestjs/common';
import { CreateCvDto } from './dtos/create-cv.dto';
import { UpdateCvDto } from './dtos/update-cv.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, SkipAuth, TOKEN_NAME } from '@modules/auth';
import { RolesGuard } from '@modules/auth/guards/role.guard';
import { Role, Roles } from '@modules/auth/decorators/roles.decorator';
import { CvEntity } from '@database/entities';
import { CvResponseDto } from './dtos/cv-response.dto';

@ApiTags('Cv')
@Controller({ path: 'cv', version: '1' })
export class CvController {
    constructor(private readonly cvService: CvService) {}

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.USER)
    @Get('me')
    async getOwnCV(@CurrentUser() user): Promise<CvResponseDto> {
        return this.cvService.getOwnCV(user.profileId);
    }

    @SkipAuth()
    @Get(':id')
    async getCandidateCV(@Query('id') accountId: string): Promise<CvResponseDto> {
        return this.cvService.getCvByUserId(accountId);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.USER)
    @Post('')
    async uploadCV(@CurrentUser() user, @Body() body: CreateCvDto) {
        return this.cvService.uploadCV(body, user);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.USER)
    @Put(':id')
    async updateCV(@Query('id') cvId: string, @CurrentUser() user, @Body() body: CreateCvDto) {
        return this.cvService.updateCV(cvId, body, user);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @UseGuards(RolesGuard)
    @Roles(Role.USER)
    @Delete(':id')
    async deleteCV(@Query('id') cvId: string, @CurrentUser() user) {
        return this.cvService.deleteCV(cvId, user);
    }
}
