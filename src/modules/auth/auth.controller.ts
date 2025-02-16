import { ValidationPipe, Controller, Post, Body, Get, UseGuards, Res, Req, HttpCode } from '@nestjs/common';
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
    AuthRegisterRequestDto,
    LoginResponseDto,
    RegisterResponseDto,
    EmailVerifyDto,
    EmailVerifyDtoNoCode,
    RegisterResponseDtoBuilder,
} from './dtos';
import { TokenService, AuthService } from './services';
import { Response } from 'express';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { RefreshTokenResponseDto } from './dtos/refresh-token-response.dto';
import { AccountEntity, ProfileEntity } from '@database/entities';
import { Role, Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/role.guard';
import { ForgetPasswordDto } from './dtos/forget-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

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
    @HttpCode(200)
    @ApiOperation({ description: 'User authentication' })
    @ApiOkResponse({ description: 'Successfully authenticated user' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Post('/login')
    async login(
        @Body(ValidationPipe) authCredentialsDto: AuthCredentialsRequestDto,
        @Res({ passthrough: true }) res: Response
    ): Promise<LoginResponseDto> {
        try {
            const { builder, refreshToken, refreshTokenExpires } = await this.authService.login(authCredentialsDto);

            res.cookie('refresh-token', refreshToken, {
                httpOnly: true,
                sameSite: true,
                secure: true,
                maxAge: refreshTokenExpires,
            });

            return builder;
        } catch (error) {
            return error;
        }
    }
    @HttpCode(200)
    @SkipAuth()
    @ApiOperation({ description: 'User register account' })
    @ApiOkResponse({ description: 'Successfully register account user' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Post('/register')
    register(@Body(ValidationPipe) authCredentialsDto: AuthRegisterRequestDto): Promise<RegisterResponseDto> {
        return this.authService.register(authCredentialsDto);
    }

    @ApiBearerAuth(TOKEN_NAME)
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
    @ApiBearerAuth(TOKEN_NAME)
    @ApiOperation({ description: 'Get user information' })
    @ApiOkResponse({ description: 'User information' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    @UseGuards(JwtAuthGuard)
    @UseGuards(RolesGuard)
    @Roles(Role.USER)
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Get('/me')
    async getMe(@CurrentUser() user: AccountEntity): Promise<RegisterResponseDto> {
        return this.authService.getMe(user.accountId);
    }

    @SkipAuth()
    @UseGuards(JwtRefreshAuthGuard)
    @Post('/refresh-token')
    async refreshToken(
        @Req() request: any,
        @Res({ passthrough: true }) response: Response
    ): Promise<RefreshTokenResponseDto> {
        try {
            const refreshToken = request.cookies?.['refresh-token'];
            const {
                refreshToken: newRefreshToken,
                refreshTokenExpires,
                builder,
            } = await this.authService.refreshToken(request?.user, refreshToken);

            response.cookie('refresh-token', newRefreshToken, {
                httpOnly: true,
                sameSite: true,
                secure: true,
                maxAge: refreshTokenExpires,
            });

            return builder;
        } catch (error) {
            return error;
        }
    }

    @SkipAuth()
    @ApiOperation({ description: 'User verify email' })
    @ApiOkResponse({ description: 'Successfully sent verification code' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Post('/verify-email')
    async verifyEmail(@Body(ValidationPipe) data: EmailVerifyDto) {
        return await this.authService.verifyEmailCode(data);
    }
    // api resend email
    @HttpCode(200)
    @SkipAuth()
    @ApiOperation({ description: 'Resend email verification' })
    @ApiOkResponse({ description: 'Successfully sent verification code' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Post('/resend-email')
    async resendEmail(@Body(ValidationPipe) data: EmailVerifyDtoNoCode): Promise<RegisterResponseDto> {
        return await this.authService.resendEmailCode(data);
    }

    @HttpCode(200)
    @SkipAuth()
    @ApiOperation({ description: 'Resend email verification' })
    @ApiOkResponse({ description: 'Successfully sent verification code' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Post('/forget-password')
    async forgetPassword(@Body() data: ForgetPasswordDto): Promise<RegisterResponseDto> {
        return await this.authService.forgetPassword(data);
    }

    @HttpCode(200)
    @SkipAuth()
    @ApiOperation({ description: 'Resend email verification' })
    @ApiOkResponse({ description: 'Successfully sent verification code' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @Post('/reset-password')
    async resetPassword(@Body() data: ResetPasswordDto): Promise<RegisterResponseDto> {
        return await this.authService.resetPassword(data);
    }

    @HttpCode(200)
    @ApiOperation({ description: 'Resend email verification' })
    @ApiOkResponse({ description: 'Successfully sent verification code' })
    @ApiInternalServerErrorResponse({ description: 'Server error' })
    @UseGuards(JwtRefreshAuthGuard)
    @Post('/logout')
    async logout(@CurrentUser() user, @Res({ passthrough: true }) res: Response) {
        try {
            const logoutBuilder = await this.authService.logout(user?.accountId, user?.refreshToken);
            if (logoutBuilder.value as boolean) {
                res.clearCookie('refresh-token');
            }
            return logoutBuilder;
        } catch (error) {
            return error;
        }
    }
}
