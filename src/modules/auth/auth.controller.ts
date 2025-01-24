import { ValidationPipe, Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
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
    LoginResponseDto,
    TokenDto,
} from './dtos';
import { TokenService, AuthService } from './services';

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
    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ description: 'User authentication' })
    @ApiOkResponse({ description: 'Successfully authenticated user' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Post('/login')
    login(@Body(ValidationPipe) authCredentialsDto: AuthCredentialsRequestDto): Promise<LoginResponseDto> {
        return this.authService.login(authCredentialsDto);
    }
    @SkipAuth()
    @ApiOperation({ description: 'Renew access in the application' })
    @ApiOkResponse({ description: 'Token successfully renewed' })
    @ApiUnauthorizedResponse({ description: 'Refresh token invalid or expired' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Post('/token/refresh')
    async getNewToken(@Body(ValidationPipe) refreshTokenDto: RefreshTokenRequestDto): Promise<TokenDto> {
        const { refreshToken } = refreshTokenDto;
        return this.tokenService.generateRefreshToken(refreshToken);
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
}
