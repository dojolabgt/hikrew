import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './service.entity';
import { Workspace } from '../workspaces/workspace.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Workspace]), WorkspacesModule, BillingModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
