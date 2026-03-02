import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingSubscription } from './billing-subscription.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { BillingWebhookController } from './billing-webhook.controller';
import { RecurrenteBlendService } from './recurrente-blend.service';
import { FreelancerProfile } from '../freelancer-profile/freelancer-profile.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([BillingSubscription, FreelancerProfile]),
    ],
    providers: [BillingService, RecurrenteBlendService],
    controllers: [BillingController, BillingWebhookController],
    exports: [BillingService],
})
export class BillingModule { }
