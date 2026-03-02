import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { User } from '../users/user.entity';
import { UserRole } from './constants/roles';
import { SettingsService } from '../core/settings/settings.service';
import { RegisterDto } from './dto/register.dto';
import { MailService } from '../core/mail/mail.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private settingsService: SettingsService,
    private mailService: MailService,
    private workspacesService: WorkspacesService,
  ) { }

  async register(registerDto: RegisterDto) {
    const settings = await this.settingsService.getSettings();
    if (!settings.allowRegistration) {
      throw new ForbiddenException('Registration is disabled by administrator');
    }

    const existingUser = await this.usersService.findOneByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new ForbiddenException('User already exists');
    }

    // All public registrations create a FREELANCER account
    const newUser = await this.usersService.create({
      ...registerDto,
      role: UserRole.FREELANCER,
    });

    // Auto-create an empty Workspace linked to the new user as OWNER
    await this.workspacesService.createDefaultWorkspace(newUser.id);

    const userWithWorkspaces = await this.usersService.findOneById(newUser.id);

    return this.login(this.mapToAuthenticatedUser(userWithWorkspaces!));
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return { message: 'If user exists, email sent' };
    }

    // Generate specific reset token
    const token = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, type: 'reset' },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1h',
      },
    );

    const isDevelopment = this.configService.get('NODE_ENV') !== 'production';

    // Log token only in development
    if (isDevelopment) {
      this.logger.log(`Reset Token for ${email}: ${token}`);
    }

    try {
      await this.mailService.sendPasswordReset(user, token);
    } catch (error) {
      if (isDevelopment) {
        this.logger.error(`Error sending email to ${user.email}:`, error);
      }
      // Don't throw to avoid user enumeration
    }

    // ✅ Only return token in development for testing
    return {
      message: 'If user exists, email sent',
      ...(isDevelopment && { token }),
    };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        type: string;
      }>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.type !== 'reset') {
        throw new ForbiddenException('Invalid token type');
      }

      const user = await this.usersService.findOneById(payload.sub);
      if (!user) {
        throw new ForbiddenException('Invalid token');
      }

      await this.usersService.setPassword(user.id, newPassword);

      return { message: 'Password updated successfully' };
    } catch {
      throw new ForbiddenException('Invalid or expired token');
    }
  }

  async validateUser(
    email: string,
    pass: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.usersService.findOneByEmailWithPassword(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      return this.mapToAuthenticatedUser(user);
    }
    return null;
  }

  // Helper to centralize the mapping from User entity to AuthenticatedUser
  // This avoids scattered casting throughout the codebase

  private mapToAuthenticatedUser(user: User): AuthenticatedUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...result } = user;
    return result;
  }

  async login(user: AuthenticatedUser) {
    const tokens = await this.getTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    return this.usersService.update(userId, { refreshToken: null });
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user || !user.refreshToken)
      throw new ForbiddenException('Access Denied');

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(this.mapToAuthenticatedUser(user));
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async getTokens(user: AuthenticatedUser) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      workspaces: user.workspaceMembers?.map(wm => ({
        id: wm.workspace.id,
        role: wm.role,
        businessName: wm.workspace.businessName
      })) || []
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        payload,
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        payload,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async getUserById(userId: string) {
    return this.usersService.findOneById(userId);
  }
}
