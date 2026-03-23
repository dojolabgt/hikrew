import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealsController } from './deals.controller';
import { PublicBriefsController } from './public-briefs.controller';
import { PublicDealsController } from './public-deals.controller';
import { DealsService } from './deals.service';
import { Deal } from './entities/deal.entity';
import { BriefTemplate } from './entities/brief-template.entity';
import { Brief } from './entities/brief.entity';
import { Quotation } from './entities/quotation.entity';
import { QuotationItem } from './entities/quotation-item.entity';
import { PaymentPlan } from './entities/payment-plan.entity';
import { PaymentMilestone } from './entities/payment-milestone.entity';
import { Workspace } from '../workspaces/workspace.entity';
import { Client } from '../clients/client.entity';
import { Service } from '../services/service.entity';
import { MilestoneSplit } from './entities/milestone-split.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectsModule } from '../projects/projects.module';
import { GoogleDriveModule } from '../google-drive/google-drive.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Deal,
      BriefTemplate,
      Brief,
      Quotation,
      QuotationItem,
      PaymentPlan,
      PaymentMilestone,
      Workspace,
      Client,
      Service,
      MilestoneSplit,
      Project,
    ]),
    ProjectsModule,
    GoogleDriveModule,
    BillingModule,
  ],
  controllers: [DealsController, PublicBriefsController, PublicDealsController],
  providers: [DealsService],
})
export class DealsModule {}
