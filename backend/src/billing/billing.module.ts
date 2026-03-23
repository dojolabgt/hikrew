import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingSubscription } from './billing-subscription.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { BillingWebhookController } from './billing-webhook.controller';
import { RecurrenteHiKrewService } from './recurrente-hi-krew.service';
import { PlanLimitsService } from './plan-limits.service';
import { Workspace } from '../workspaces/workspace.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BillingSubscription, Workspace]),
    WorkspacesModule,
  ],
  providers: [BillingService, RecurrenteHiKrewService, PlanLimitsService],
  controllers: [BillingController, BillingWebhookController],
  exports: [BillingService, PlanLimitsService],
})
export class BillingModule { }
