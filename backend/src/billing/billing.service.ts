import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BillingSubscription, BillingSubscriptionStatus } from './billing-subscription.entity';
import { RecurrenteBlendService } from './recurrente-blend.service';
import { FreelancerProfile } from '../freelancer-profile/freelancer-profile.entity';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class BillingService {
    private readonly logger = new Logger(BillingService.name);

    constructor(
        @InjectRepository(BillingSubscription)
        private readonly subscriptionRepo: Repository<BillingSubscription>,
        @InjectRepository(FreelancerProfile)
        private readonly profileRepo: Repository<FreelancerProfile>,
        private readonly recurrenteBlend: RecurrenteBlendService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Returns the current billing status for a freelancer:
     * plan, planExpiresAt, active subscription (if any), and prices.
     */
    async getStatus(userId: string) {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile) throw new NotFoundException('Perfil no encontrado');

        const activeSubscription = await this.subscriptionRepo.findOne({
            where: { freelancerId: userId, status: 'active' },
            order: { createdAt: 'DESC' },
        });

        return {
            plan: profile.plan,
            planExpiresAt: profile.planExpiresAt,
            subscription: activeSubscription ?? null,
            prices: this.recurrenteBlend.prices,
        };
    }

    /**
     * Creates a Recurrente subscription checkout and persists the pending BillingSubscription.
     * Returns the checkout URL to redirect the user.
     */
    async subscribe(userId: string, dto: SubscribeDto): Promise<{ checkoutUrl: string }> {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile) throw new NotFoundException('Perfil no encontrado');

        if (profile.plan === 'pro') {
            const active = await this.subscriptionRepo.findOne({
                where: { freelancerId: userId, status: 'active' },
            });
            if (active) {
                throw new BadRequestException('Ya tienes una suscripción activa');
            }
        }

        const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_PUBLIC_URL');
        const successUrl = `${frontendUrl}/dashboard/billing?success=1`;
        const cancelUrl = `${frontendUrl}/dashboard/billing?cancelled=1`;

        const checkout = await this.recurrenteBlend.createSubscriptionCheckout(
            userId,
            dto.plan,
            dto.interval,
            successUrl,
            cancelUrl,
        );

        await this.subscriptionRepo.save(
            this.subscriptionRepo.create({
                freelancerId: userId,
                recurrenteCheckoutId: checkout.id,
                plan: dto.plan,
                interval: dto.interval,
                status: 'pending',
            }),
        );

        this.logger.log(`Created billing checkout ${checkout.id} for freelancer ${userId}`);
        return { checkoutUrl: checkout.checkout_url };
    }

    /**
     * Cancels the active subscription in Recurrente and marks it cancelled locally.
     */
    async cancelSubscription(userId: string): Promise<void> {
        const subscription = await this.subscriptionRepo.findOne({
            where: { freelancerId: userId, status: 'active' },
        });

        if (!subscription) {
            throw new NotFoundException('No tienes una suscripción activa');
        }

        if (subscription.recurrenteSubscriptionId) {
            await this.recurrenteBlend.cancelSubscription(subscription.recurrenteSubscriptionId);
        }

        subscription.status = 'cancelled';
        await this.subscriptionRepo.save(subscription);

        await this.profileRepo.update({ userId }, { plan: 'free', planExpiresAt: null });

        this.logger.log(`Subscription cancelled for freelancer ${userId}`);
    }

    /**
     * Returns a list of all billing subscriptions for a freelancer, newest first.
     */
    async getHistory(userId: string): Promise<BillingSubscription[]> {
        return this.subscriptionRepo.find({
            where: { freelancerId: userId },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Handles incoming webhook events from Recurrente's billing webhook.
     * Routes events by type and updates subscription + profile plan accordingly.
     */
    async handleWebhookEvent(body: Record<string, unknown>): Promise<void> {
        const eventType = body['event'] as string | undefined;
        const metadata = (body['metadata'] ?? {}) as Record<string, string>;
        const data = (body['data'] ?? {}) as Record<string, unknown>;

        // Safety check — only handle blend_billing context
        if (metadata['context'] !== 'blend_billing') {
            this.logger.warn(`Received webhook with unexpected context: ${metadata['context']}`);
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

    private async handleCheckoutPaid(data: Record<string, unknown>): Promise<void> {
        const checkoutId = data['id'] as string;
        const subscriptionId = (data['payment'] as Record<string, unknown>)?.['paymentable']?.['id'] as string | undefined;
        const periodEnd = (data['subscription'] as Record<string, unknown>)?.['current_period_end'] as string | undefined;
        const periodStart = (data['subscription'] as Record<string, unknown>)?.['current_period_start'] as string | undefined;

        const subscription = await this.subscriptionRepo.findOne({
            where: { recurrenteCheckoutId: checkoutId },
        });

        if (!subscription) {
            this.logger.warn(`No BillingSubscription found for checkout ${checkoutId}`);
            return;
        }

        subscription.status = 'active';
        if (subscriptionId) subscription.recurrenteSubscriptionId = subscriptionId;
        if (periodStart) subscription.currentPeriodStart = new Date(periodStart);
        if (periodEnd) subscription.currentPeriodEnd = new Date(periodEnd);
        await this.subscriptionRepo.save(subscription);

        // Upgrade plan
        await this.profileRepo.update(
            { userId: subscription.freelancerId },
            {
                plan: subscription.plan as any,
                planExpiresAt: periodEnd ? new Date(periodEnd) : null,
            },
        );

        this.logger.log(`Freelancer ${subscription.freelancerId} upgraded to ${subscription.plan.toUpperCase()} via checkout ${checkoutId}`);
    }

    private async handleSubscriptionPaid(data: Record<string, unknown>): Promise<void> {
        const recurrenteSubId = data['id'] as string;
        const periodEnd = data['current_period_end'] as string | undefined;
        const periodStart = data['current_period_start'] as string | undefined;

        const subscription = await this.subscriptionRepo.findOne({
            where: { recurrenteSubscriptionId: recurrenteSubId },
        });

        if (!subscription) {
            this.logger.warn(`No subscription found for recurrente ID ${recurrenteSubId}`);
            return;
        }

        subscription.status = 'active';
        if (periodStart) subscription.currentPeriodStart = new Date(periodStart);
        if (periodEnd) subscription.currentPeriodEnd = new Date(periodEnd);
        await this.subscriptionRepo.save(subscription);

        await this.profileRepo.update(
            { userId: subscription.freelancerId },
            {
                plan: subscription.plan as any,
                planExpiresAt: periodEnd ? new Date(periodEnd) : null,
            },
        );
    }

    private async handleSubscriptionPastDue(data: Record<string, unknown>): Promise<void> {
        const recurrenteSubId = data['id'] as string;
        const subscription = await this.subscriptionRepo.findOne({
            where: { recurrenteSubscriptionId: recurrenteSubId },
        });

        if (subscription) {
            subscription.status = 'past_due';
            await this.subscriptionRepo.save(subscription);
            // TODO: send past_due email notification via MailService
            this.logger.warn(`Subscription past_due for freelancer ${subscription.freelancerId}`);
        }
    }

    private async handleSubscriptionCancelled(data: Record<string, unknown>): Promise<void> {
        const recurrenteSubId = data['id'] as string;
        const subscription = await this.subscriptionRepo.findOne({
            where: { recurrenteSubscriptionId: recurrenteSubId },
        });

        if (subscription) {
            subscription.status = 'cancelled';
            await this.subscriptionRepo.save(subscription);

            await this.profileRepo.update(
                { userId: subscription.freelancerId },
                { plan: 'free', planExpiresAt: null },
            );

            this.logger.log(`Freelancer ${subscription.freelancerId} downgraded to FREE`);
        }
    }

    private async handleSubscriptionUnableToStart(data: Record<string, unknown>): Promise<void> {
        const recurrenteSubId = data['id'] as string;
        await this.subscriptionRepo.update(
            { recurrenteSubscriptionId: recurrenteSubId },
            { status: 'unable_to_start' as BillingSubscriptionStatus },
        );
        this.logger.error(`Subscription unable_to_start for recurrente ID ${recurrenteSubId}`);
    }
}
