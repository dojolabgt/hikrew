import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../../users/user.entity';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) { }

  async sendUserConfirmation(user: User, token: string) {
    // ✅ Use dashboard URL where authentication happens
    const dashboardUrl = this.configService.get<string>(
      'NEXT_PUBLIC_DASHBOARD_URL',
    );
    const url = `${dashboardUrl}/auth/confirm?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Welcome to Nice App! Confirm your Email',
      template: './confirmation',
      context: {
        name: user.firstName,
        url,
      },
    });
  }

  async sendPasswordReset(user: User, token: string) {
    // ✅ Use dashboard URL where password reset happens
    const dashboardUrl = this.configService.get<string>(
      'NEXT_PUBLIC_DASHBOARD_URL',
    );
    const url = `${dashboardUrl}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Reset Password',
      template: './reset-password',
      context: {
        name: user.firstName,
        url,
      },
    });
  }
}
