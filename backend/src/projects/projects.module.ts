import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingModule } from '../billing/billing.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { ProjectBrief } from './entities/project-brief.entity';
import { ProjectCollaborator } from './entities/project-collaborator.entity';
import { Workspace } from '../workspaces/workspace.entity';
import { Deal } from '../deals/entities/deal.entity';
import { Brief } from '../deals/entities/brief.entity';
import { Quotation } from '../deals/entities/quotation.entity';
import { QuotationItem } from '../deals/entities/quotation-item.entity';
import { Client } from '../clients/client.entity';
import { PaymentPlan } from '../deals/entities/payment-plan.entity';
import { PaymentMilestone } from '../deals/entities/payment-milestone.entity';
import { MilestoneSplit } from '../deals/entities/milestone-split.entity';
import { BriefTemplate } from '../deals/entities/brief-template.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectBrief,
      ProjectCollaborator,
      Workspace,
      Deal,
      Brief,
      Quotation,
      QuotationItem,
      Client,
      PaymentPlan,
      PaymentMilestone,
      MilestoneSplit,
      BriefTemplate,
    ]),
    BillingModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
