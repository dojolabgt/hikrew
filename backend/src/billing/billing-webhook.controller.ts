import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { SkipThrottle } from '@nestjs/throttler';

/**
 * Public webhook endpoint for Recurrente billing events.
 * This controller has NO authentication — Recurrente calls it directly.
 * Security: we validate metadata.context === 'krew_billing' inside BillingService.
 */
@SkipThrottle()
@Controller('webhooks/recurrente/billing')
export class BillingWebhookController {
  private readonly logger = new Logger(BillingWebhookController.name);

  constructor(private readonly billingService: BillingService) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() body: Record<string, unknown>) {
    this.logger.log(
      `Billing webhook received: ${JSON.stringify(body['event'])}`,
    );
    await this.billingService.handleWebhookEvent(body);
    return { received: true };
  }
}
