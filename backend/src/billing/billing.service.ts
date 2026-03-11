import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  BillingSubscription,
  BillingSubscriptionStatus,
} from './billing-subscription.entity';
import { RecurrenteNodallyService } from './recurrente-nodally.service';
import { Workspace, WorkspacePlan } from '../workspaces/workspace.entity';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(BillingSubscription)
    private readonly subscriptionRepo: Repository<BillingSubscription>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    private readonly recurrenteNodally: RecurrenteNodallyService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Returns the current billing status for a workspace:
   * plan, planExpiresAt, active subscription (if any), and prices.
   */
  async getStatus(workspaceId: string) {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });
    if (!workspace)
      throw new NotFoundException('Espacio de trabajo no encontrado');

    const activeSubscription = await this.subscriptionRepo.findOne({
      where: { workspaceId, status: 'active' },
      order: { createdAt: 'DESC' },
    });

    return {
      plan: workspace.plan,
      planExpiresAt: workspace.planExpiresAt,
      subscription: activeSubscription ?? null,
      prices: this.recurrenteNodally.prices,
    };
  }

  /**
   * Creates a Recurrente subscription checkout and persists the pending BillingSubscription.
   * Returns the checkout URL to redirect the user.
   */
  async subscribe(
    workspaceId: string,
    dto: SubscribeDto,
  ): Promise<{ checkoutUrl: string }> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });
    if (!workspace)
      throw new NotFoundException('Espacio de trabajo no encontrado');

    const active = await this.subscriptionRepo.findOne({
      where: { workspaceId, status: 'active' },
    });

    if (active) {
      if (active.plan === dto.plan) {
        throw new BadRequestException('Este espacio ya tiene el plan activo');
      }
      if (active.plan === 'premium' && dto.plan === 'pro') {
        throw new BadRequestException(
          'No puedes bajar de plan desde Premium directamente. Cancela tu suscripción actual primero.',
        );
      }
    }

    const frontendUrl = this.configService.getOrThrow<string>(
      'FRONTEND_PUBLIC_URL',
    );
    const successUrl = `${frontendUrl}/dashboard/billing?success=1`;
    const cancelUrl = `${frontendUrl}/dashboard/billing?cancelled=1`;

    const checkout = await this.recurrenteNodally.createSubscriptionCheckout(
      workspaceId,
      dto.plan,
      dto.interval === 'year',
      successUrl,
      cancelUrl,
    );

    await this.subscriptionRepo.save(
      this.subscriptionRepo.create({
        workspaceId: workspaceId,
        recurrenteCheckoutId: checkout.id,
        plan: dto.plan,
        interval: dto.interval,
        status: 'pending',
      }),
    );

    this.logger.log(
      `Created billing checkout ${checkout.id} for workspace ${workspaceId}`,
    );
    return { checkoutUrl: checkout.checkout_url };
  }

  async devOverridePlan(
    workspaceId: string,
    plan: 'pro' | 'premium',
  ): Promise<{ success: boolean }> {
    if (this.configService.get('NODE_ENV') === 'production') {
      throw new BadRequestException('Not available in production');
    }

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });
    if (!workspace)
      throw new NotFoundException('Espacio de trabajo no encontrado');

    // Cancel existing active subscription if any
    const existing = await this.subscriptionRepo.findOne({
      where: { workspaceId, status: 'active' },
    });

    if (existing) {
      existing.status = 'cancelled';
      await this.subscriptionRepo.save(existing);
    }

    // Create a fake active subscription
    await this.subscriptionRepo.save(
      this.subscriptionRepo.create({
        workspaceId: workspaceId,
        recurrenteCheckoutId: `dev_checkout_${Date.now()}`,
        recurrenteSubscriptionId: `dev_sub_${Date.now()}`,
        plan,
        interval: 'month',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }),
    );

    await this.workspaceRepo.update(
      { id: workspaceId },
      {
        plan: plan as WorkspacePlan,
        planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    );

    this.logger.log(
      `Dev override: upgraded workspace ${workspaceId} to ${plan}`,
    );
    return { success: true };
  }

  /**
   * Cancels the active subscription in Recurrente and marks it cancelled locally.
   */
  async cancelSubscription(workspaceId: string): Promise<void> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { workspaceId, status: 'active' },
    });

    if (!subscription) {
      throw new NotFoundException(
        'Este espacio no tiene una suscripción activa',
      );
    }

    if (
      subscription.recurrenteSubscriptionId &&
      !subscription.recurrenteSubscriptionId.startsWith('dev_')
    ) {
      await this.recurrenteNodally.cancelSubscription(
        subscription.recurrenteSubscriptionId,
      );
    }

    subscription.status = 'cancelled';
    await this.subscriptionRepo.save(subscription);

    if (this.configService.get('NODE_ENV') !== 'production') {
      // Cancel immediately in DEV
      await this.workspaceRepo.update(
        { id: workspaceId },
        { plan: WorkspacePlan.FREE, planExpiresAt: null as unknown as Date },
      );
    } else {
      // In PROD, we let them keep access until planExpiresAt
      const workspace = await this.workspaceRepo.findOne({
        where: { id: workspaceId },
      });
      this.logger.log(
        `Subscription cancelled for ${workspaceId}, but access kept until ${workspace?.planExpiresAt?.toISOString() ?? 'N/A'}`,
      );
    }

    this.logger.log(`Subscription cancelled for workspace ${workspaceId}`);
  }

  /**
   * Returns a list of all billing subscriptions for a workspace, newest first.
   */
  async getHistory(workspaceId: string): Promise<BillingSubscription[]> {
    return this.subscriptionRepo.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Handles incoming webhook events from Recurrente's billing webhook.
   * Routes events by type and updates subscription + workspace plan accordingly.
   */
  async handleWebhookEvent(body: Record<string, unknown>): Promise<void> {
    const eventType = body['event'] as string | undefined;
    const metadata = (body['metadata'] ?? {}) as Record<string, string>;
    const data = (body['data'] ?? {}) as Record<string, unknown>;

    // Safety check — only handle nodally_billing context
    if (metadata['context'] !== 'nodally_billing') {
      this.logger.warn(
        `Received webhook with unexpected context: ${metadata['context']}`,
      );
      return;
    }

    this.logger.log(`Billing webhook received: ${eventType}`);

    switch (eventType) {
      case 'checkout.paid':
        await this.handleCheckoutPaid(data);
        break;
      case 'subscription.paid':
        await this.handleSubscriptionPaid(data);
        break;
      case 'subscription.past_due':
        await this.handleSubscriptionPastDue(data);
        break;
      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(data);
        break;
      case 'subscription.unable_to_start':
        await this.handleSubscriptionUnableToStart(data);
        break;
      default:
        this.logger.log(`Unhandled billing event: ${eventType}`);
    }
  }

  private async handleCheckoutPaid(
    data: Record<string, unknown>,
  ): Promise<void> {
    const checkoutId = data['id'] as string;
    const subscriptionId = (data['payment'] as Record<string, unknown>)?.[
      'paymentable'
    ]?.['id'] as string | undefined;
    const periodEnd = (data['subscription'] as Record<string, unknown>)?.[
      'current_period_end'
    ] as string | undefined;
    const periodStart = (data['subscription'] as Record<string, unknown>)?.[
      'current_period_start'
    ] as string | undefined;

    const subscription = await this.subscriptionRepo.findOne({
      where: { recurrenteCheckoutId: checkoutId },
    });

    if (!subscription) {
      this.logger.warn(
        `No BillingSubscription found for checkout ${checkoutId}`,
      );
      return;
    }

    subscription.status = 'active';
    if (subscriptionId) subscription.recurrenteSubscriptionId = subscriptionId;
    if (periodStart) subscription.currentPeriodStart = new Date(periodStart);
    if (periodEnd) subscription.currentPeriodEnd = new Date(periodEnd);
    await this.subscriptionRepo.save(subscription);

    // Cancel any old active subscriptions this workspace might have (Upgrades!)
    const oldSubs = await this.subscriptionRepo.find({
      where: { workspaceId: subscription.workspaceId, status: 'active' },
    });
    for (const oldSub of oldSubs) {
      if (oldSub.id !== subscription.id) {
        oldSub.status = 'cancelled';
        if (
          oldSub.recurrenteSubscriptionId &&
          !oldSub.recurrenteSubscriptionId.startsWith('dev_')
        ) {
          try {
            await this.recurrenteNodally.cancelSubscription(
              oldSub.recurrenteSubscriptionId,
            );
          } catch {
            this.logger.error(
              `Could not cancel old Recurrente sub ${oldSub.recurrenteSubscriptionId}`,
            );
          }
        }
        await this.subscriptionRepo.save(oldSub);
      }
    }

    // Upgrade plan
    await this.workspaceRepo.update(
      { id: subscription.workspaceId },
      {
        plan: subscription.plan as WorkspacePlan,
        planExpiresAt: periodEnd
          ? new Date(periodEnd)
          : (null as unknown as Date),
      },
    );

    this.logger.log(
      `Workspace ${subscription.workspaceId} upgraded to ${subscription.plan.toUpperCase()} via checkout ${checkoutId}`,
    );
  }

  private async handleSubscriptionPaid(
    data: Record<string, unknown>,
  ): Promise<void> {
    const recurrenteSubId = data['id'] as string;
    const periodEnd = data['current_period_end'] as string | undefined;
    const periodStart = data['current_period_start'] as string | undefined;

    const subscription = await this.subscriptionRepo.findOne({
      where: { recurrenteSubscriptionId: recurrenteSubId },
    });

    if (!subscription) {
      this.logger.warn(
        `No subscription found for recurrente ID ${recurrenteSubId}`,
      );
      return;
    }

    subscription.status = 'active';
    if (periodStart) subscription.currentPeriodStart = new Date(periodStart);
    if (periodEnd) subscription.currentPeriodEnd = new Date(periodEnd);
    await this.subscriptionRepo.save(subscription);

    await this.workspaceRepo.update(
      { id: subscription.workspaceId },
      {
        plan: subscription.plan as WorkspacePlan,
        planExpiresAt: periodEnd
          ? new Date(periodEnd)
          : (null as unknown as Date),
      },
    );
  }

  private async handleSubscriptionPastDue(
    data: Record<string, unknown>,
  ): Promise<void> {
    const recurrenteSubId = data['id'] as string;
    const subscription = await this.subscriptionRepo.findOne({
      where: { recurrenteSubscriptionId: recurrenteSubId },
    });

    if (subscription) {
      subscription.status = 'past_due';
      await this.subscriptionRepo.save(subscription);
      // TODO: send email notification
      this.logger.warn(
        `Subscription past_due for workspace ${subscription.workspaceId}`,
      );
    }
  }

  private async handleSubscriptionCancelled(
    data: Record<string, unknown>,
  ): Promise<void> {
    const recurrenteSubId = data['id'] as string;
    const subscription = await this.subscriptionRepo.findOne({
      where: { recurrenteSubscriptionId: recurrenteSubId },
    });

    if (subscription) {
      subscription.status = 'cancelled';
      await this.subscriptionRepo.save(subscription);

      await this.workspaceRepo.update(
        { id: subscription.workspaceId },
        { plan: WorkspacePlan.FREE, planExpiresAt: null as unknown as Date },
      );

      this.logger.log(
        `Workspace ${subscription.workspaceId} downgraded to FREE`,
      );
    }
  }

  private async handleSubscriptionUnableToStart(
    data: Record<string, unknown>,
  ): Promise<void> {
    const recurrenteSubId = data['id'] as string;
    await this.subscriptionRepo.update(
      { recurrenteSubscriptionId: recurrenteSubId },
      { status: 'unable_to_start' as BillingSubscriptionStatus },
    );
    this.logger.error(
      `Subscription unable_to_start for recurrente ID ${recurrenteSubId}`,
    );
  }
}
