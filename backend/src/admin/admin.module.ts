import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [BillingModule],
  controllers: [AdminController],
  providers: [],
})
export class AdminModule {}
