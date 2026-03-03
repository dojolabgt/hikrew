import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';

@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Returns the current plan, planExpiresAt, active subscription, and pricing.
   */
  @Get('status')
  getStatus(@Request() req: any) {
    return this.billingService.getStatus(req.workspaceId);
  }

  /**
   * Creates a Recurrente checkout for a subscription.
   * Returns the checkout URL to redirect the user.
   */
  @Post('subscribe')
  subscribe(@Request() req: any, @Body() dto: SubscribeDto) {
    return this.billingService.subscribe(req.workspaceId, dto);
  }

  /**
   * Development override to instantly switch plans
   */
  @Post('dev-override')
  devOverride(@Request() req: any, @Body() dto: { plan: 'pro' | 'premium' }) {
    return this.billingService.devOverridePlan(req.workspaceId, dto.plan);
  }

  /**
   * Cancels the active subscription and downgrades the plan to free.
   */
  @Post('cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancel(@Request() req: any) {
    return this.billingService.cancelSubscription(req.workspaceId);
  }

  /**
   * Returns the billing history (all subscriptions) for the workspace.
   */
  @Get('history')
  getHistory(@Request() req: any) {
    return this.billingService.getHistory(req.workspaceId);
  }
}
