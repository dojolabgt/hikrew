import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { User } from '../../users/user.entity';
import { Client } from '../../clients/client.entity';
import { Workspace, WorkspacePlan } from '../../workspaces/workspace.entity';

interface MailEvent {
  template: string;
  to: string;
  subject: string;
  from?: string;
  data: Record<string, unknown>;
}

@Injectable()
export class MailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
  private redis: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.redis = new Redis(this.config.get<string>('REDIS_URL')!);
    this.redis.on('error', (err) =>
      this.logger.error('Redis connection error', err),
    );
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  private async enqueue(event: MailEvent): Promise<void> {
    const queue = this.config.get<string>('REDIS_QUEUE_NAME', 'email_queue');
    await this.redis.lpush(queue, JSON.stringify(event));
  }

  async sendUserConfirmation(user: User, token: string) {
    const dashboardUrl = this.config.get<string>('NEXT_PUBLIC_DASHBOARD_URL');
    const url = `${dashboardUrl}/auth/confirm?token=${token}`;
    await this.enqueue({
      template: 'confirmation',
      to: user.email,
      subject: 'Welcome to Hi Krew! Confirm your Email',
      data: { name: user.firstName, url },
    });
  }

  async sendClientInvite(
    client: Client,
    workspace: Workspace | null | undefined,
    magicLink: string,
  ) {
    const workspaceName = workspace?.businessName || 'Tu proveedor';
    const isPaid =
      workspace?.plan === WorkspacePlan.PRO ||
      workspace?.plan === WorkspacePlan.PREMIUM;

    const senderName = isPaid ? workspaceName : 'Hi Krew';
    const mailFrom = this.config.get<string>('MAIL_FROM', 'Hi Krew <noreply@hikrew.com>');
    const fromAddress = mailFrom.replace(/^[^<]*/, `${senderName} `);

    await this.enqueue({
      template: 'client-invite',
      to: client.email,
      subject: `${workspaceName} te invita al portal de clientes`,
      from: fromAddress,
      data: { clientName: client.name, workspaceName, senderName, magicLink },
    });
  }

  async sendPasswordReset(user: User, token: string) {
    const dashboardUrl = this.config.get<string>('NEXT_PUBLIC_DASHBOARD_URL');
    const url = `${dashboardUrl}/reset-password?token=${token}`;
    await this.enqueue({
      template: 'reset-password',
      to: user.email,
      subject: 'Reset Password',
      data: { name: user.firstName, url },
    });
  }

  async sendWelcome(user: User) {
    const dashboardUrl = this.config.get<string>('NEXT_PUBLIC_DASHBOARD_URL');
    await this.enqueue({
      template: 'welcome',
      to: user.email,
      subject: '¡Bienvenido a Hi Krew!',
      data: { name: user.firstName, dashboardUrl },
    });
  }

  async sendConnectionInvite(
    email: string,
    workspaceName: string,
    token: string,
  ) {
    const dashboardUrl = this.config.get<string>('NEXT_PUBLIC_DASHBOARD_URL');
    const acceptUrl = `${dashboardUrl}/invite/connection?token=${token}`;
    await this.enqueue({
      template: 'connection-invite',
      to: email,
      subject: `${workspaceName} quiere conectarse contigo en Hi Krew`,
      data: { workspaceName, acceptUrl },
    });
  }
}
