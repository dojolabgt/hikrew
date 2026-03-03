import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingInterval } from './billing-subscription.entity';

const RECURRENTE_API = 'https://app.recurrente.com/api';

/**
 * Prices in cents for each plan interval.
 * Defaults: Q149/month, Q1490/year (~Q124/mes con 2 meses gratis)
 * Override via BILLING_PRO_MONTHLY_CENTS / BILLING_PRO_YEARLY_CENTS env vars.
 */
const DEFAULT_MONTHLY_CENTS = 14900;
const DEFAULT_YEARLY_CENTS = 149000;

interface RecurrenteCheckoutResponse {
  id: string;
  checkout_url: string;
}

@Injectable()
export class RecurrenteBlendService {
  private readonly logger = new Logger(RecurrenteBlendService.name);
  private readonly publicKey: string;
  private readonly secretKey: string;
  private readonly monthlyPriceCents: number;
  private readonly yearlyPriceCents: number;

  constructor(private readonly configService: ConfigService) {
    this.publicKey = this.configService.getOrThrow<string>(
      'BLEND_RECURRENTE_PUBLIC_KEY',
    );
    this.secretKey = this.configService.getOrThrow<string>(
      'BLEND_RECURRENTE_SECRET_KEY',
    );
    this.monthlyPriceCents =
      this.configService.get<number>('BILLING_PRO_MONTHLY_CENTS') ??
      DEFAULT_MONTHLY_CENTS;
    this.yearlyPriceCents =
      this.configService.get<number>('BILLING_PRO_YEARLY_CENTS') ??
      DEFAULT_YEARLY_CENTS;
  }

  private get authHeaders(): Record<string, string> {
    return {
      'X-PUBLIC-KEY': this.publicKey,
      'X-SECRET-KEY': this.secretKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Creates a Recurrente subscription checkout using Blend's own keys.
   * All checkouts carry metadata { workspaceId, context: 'blend_billing' }
   * so the webhook handler can route the event correctly.
   */
  async createSubscriptionCheckout(
    workspaceId: string,
    planType: 'pro' | 'premium',
    isAnnual: boolean,
    successUrl: string,
    cancelUrl: string,
  ): Promise<RecurrenteCheckoutResponse> {
    const isMonthly = !isAnnual;
    const amountInCents = isMonthly
      ? this.monthlyPriceCents
      : this.yearlyPriceCents;

    const itemName =
      planType === 'premium'
        ? `Blend Premium — ${isMonthly ? 'Mensual' : 'Anual'}`
        : `Blend Pro — ${isMonthly ? 'Mensual' : 'Anual'}`;

    const payload = {
      items: [
        {
          name: itemName,
          description:
            'Acceso completo a Blend: clientes ilimitados, cotizaciones ilimitadas y más.',
          currency: 'GTQ',
          amount_in_cents: amountInCents,
          charge_type: 'recurring',
          billing_interval: isMonthly ? 'month' : 'year',
          billing_interval_count: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      custom_info: {
        workspaceId,
        context: 'blend_billing',
        plan: planType,
      },
    };

    try {
      const res = await fetch(`${RECURRENTE_API}/checkouts`, {
        method: 'POST',
        headers: this.authHeaders,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        this.logger.error(`Recurrente checkout error: ${res.status} ${text}`);
        throw new InternalServerErrorException(
          'No se pudo crear el checkout de suscripción',
        );
      }

      return res.json() as Promise<RecurrenteCheckoutResponse>;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error('Network error creating Recurrente checkout', error);
      throw new InternalServerErrorException(
        'No se pudo crear el checkout de suscripción',
      );
    }
  }

  /**
   * Cancels an active Recurrente subscription.
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const res = await fetch(
        `${RECURRENTE_API}/subscriptions/${subscriptionId}`,
        {
          method: 'DELETE',
          headers: this.authHeaders,
        },
      );

      if (!res.ok) {
        const text = await res.text();
        this.logger.error(`Recurrente cancel error: ${res.status} ${text}`);
        throw new InternalServerErrorException(
          'No se pudo cancelar la suscripción',
        );
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error(
        `Network error cancelling subscription ${subscriptionId}`,
        error,
      );
      throw new InternalServerErrorException(
        'No se pudo cancelar la suscripción',
      );
    }
  }

  get prices() {
    return {
      monthly: this.monthlyPriceCents,
      yearly: this.yearlyPriceCents,
    };
  }
}
