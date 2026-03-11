import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { ProjectCollaborator } from './entities/project-collaborator.entity';
import { Workspace } from '../workspaces/workspace.entity';
import { Deal } from '../deals/entities/deal.entity';
import { PaymentMilestone } from '../deals/entities/payment-milestone.entity';
import { MilestoneSplit } from '../deals/entities/milestone-split.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectCollaborator,
      Workspace,
      Deal,
      PaymentMilestone,
      MilestoneSplit,
    ]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
