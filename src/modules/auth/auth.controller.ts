import { ValidationPipe, Controller, Post, Body, Get, UseGuards, Res, Req } from '@nestjs/common';
import {
    ApiInternalServerErrorResponse,
    ApiUnauthorizedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, SkipAuth, TOKEN_NAME } from './index';
import {
    AuthCredentialsRequestDto,
    ValidateTokenResponseDto,
    ValidateTokenRequestDto,
    RefreshTokenRequestDto,
    AuthRegisterRequestDto,
    LoginResponseDto,
    TokenDto,
    RegisterResponseDto,
    JwtPayload,
} from './dtos';
import { TokenService, AuthService } from './services';
import { Response } from 'express';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';

// @SkipAuth()
@ApiTags('Auth')
@Controller({
    path: 'auth',
    version: '1',
})
export class AuthController {
    constructor(
        private authService: AuthService,
        private tokenService: TokenService
    ) {}
    @SkipAuth()
    @ApiOperation({ description: 'User authentication' })
    @ApiOkResponse({ description: 'Successfully authenticated user' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Post('/login')
    async login(
        @Body(ValidationPipe) authCredentialsDto: AuthCredentialsRequestDto,
        @Res() response: Response
    ): Promise<void> {
        const loginDto = await this.authService.login(authCredentialsDto);
        response
            .cookie('refresh-token', loginDto.token.refreshToken, { maxAge: 10000000000, httpOnly: true, secure: true })
            .json(loginDto);
    }

    @SkipAuth()
    @ApiOperation({ description: 'User register account' })
    @ApiOkResponse({ description: 'Successfully register account user' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Post('/register')
    register(@Body(ValidationPipe) authCredentialsDto: AuthRegisterRequestDto): Promise<RegisterResponseDto> {
        return this.authService.register(authCredentialsDto);
    }

    @SkipAuth()
    @ApiOperation({ description: 'Validate token' })
    @ApiOkResponse({ description: 'Validation was successful' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Post('/token/validate')
    async validateToken(
        @Body(ValidationPipe) validateToken: ValidateTokenRequestDto
    ): Promise<ValidateTokenResponseDto> {
        const { token } = validateToken;
        return this.tokenService.validateToken(token);
    }

    @ApiOperation({ description: 'Get user information' })
    @ApiOkResponse({ description: 'User information' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @UseGuards(JwtAuthGuard)
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get('/me')
    async getMe(@CurrentUser() user: any): Promise<any> {
        return user;
    }

    @SkipAuth()
    @UseGuards(JwtRefreshAuthGuard)
    @Post('/refresh-token')
    async refreshToken(@Req() request: any, @Res() response: Response): Promise<void> {
        const refreshToken = request.cookies?.['refresh-token'];
        const { refreshToken: newRefreshToken, ...token } = await this.authService.refreshToken(
            request?.user,
            refreshToken
        );

        response.cookie('refresh-token', newRefreshToken).json({ token });
    }
}
