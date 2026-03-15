import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingSubscription } from './billing-subscription.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { BillingWebhookController } from './billing-webhook.controller';
import { RecurrenteHiKrewService } from './recurrente-hi-krew.service';
import { Workspace } from '../workspaces/workspace.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BillingSubscription, Workspace]),
    WorkspacesModule,
  ],
  providers: [BillingService, RecurrenteHiKrewService],
  controllers: [BillingController, BillingWebhookController],
  exports: [BillingService],
})
export class BillingModule { }
