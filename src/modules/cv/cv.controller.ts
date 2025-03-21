import { CvService } from './services/cv.service';
import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, UseGuards, Put } from '@nestjs/common';
import { CreateCvDto } from './dtos/create-cv.dto';
import { UpdateCvDto } from './dtos/update-cv.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, TOKEN_NAME } from '@modules/auth';
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
    @Get('')
    async getAllCvByIdProfile(@CurrentUser() user): Promise<CvResponseDto> {
        return this.cvService.getAllCvByIdProfile(user.profileId);
    }

    @ApiBearerAuth(TOKEN_NAME)
    @Put('')
    async uploadCV(@CurrentUser() user, @Body() body: CreateCvDto) {
        return this.cvService.uploadCV(body, user);
    }
}
