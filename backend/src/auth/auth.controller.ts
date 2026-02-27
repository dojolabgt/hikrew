import {
  Controller,
  Post,
  UseGuards,
  Req,
  Res,
  Get,
  UnauthorizedException,
  Logger,
  HttpCode,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import type { Response as ExpressResponse } from 'express';
import type { RequestWithUser } from './interfaces/request-with-user.interface';
import { AUTH_COOKIE, REFRESH_COOKIE } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    if (!req.user) {
      throw new UnauthorizedException();
    }
    const { accessToken, refreshToken } = await this.authService.login(
      req.user,
    );

    this.setAuthCookies(res, accessToken, refreshToken);

    return { message: 'Login successful', user: req.user };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.register(registerDto);

    this.setAuthCookies(res, accessToken, refreshToken);

    // Get user again to return full object if needed, or just tokens/success
    return { message: 'Registration successful' };
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    if (req.user) {
      await this.authService.logout(req.user.id);
    }
    res.clearCookie(AUTH_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    return { message: 'Logout successful' };
  }

  @UseGuards(RefreshTokenGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('refresh')
  async refresh(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const refreshTokenCookie = req.cookies?.[REFRESH_COOKIE];
    if (!req.user || !refreshTokenCookie) {
      throw new UnauthorizedException('Access Denied');
    }
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      req.user.id,
      refreshTokenCookie,
    );

    this.setAuthCookies(res, accessToken, refreshToken);

    return { message: 'Refresh successful' };
  }

  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @Get('me')
  async getMe(@Req() req: RequestWithUser) {
    if (!req.user) {
      throw new UnauthorizedException();
    }

    const user = await this.authService.getUserById(req.user.id);
    if (!user) {
      this.logger.warn(`User ${req.user.id} not found in database`);
      throw new UnauthorizedException();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...result } = user;
    return result;
  }

  private setAuthCookies(
    res: ExpressResponse,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie(AUTH_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
