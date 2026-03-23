import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleDriveService } from './google-drive.service';
import {
  WorkspaceDriveController,
  GoogleDriveCallbackController,
  ProjectDriveController,
} from './google-drive.controller';
import { Workspace } from '../workspaces/workspace.entity';
import { Project } from '../projects/entities/project.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, Project]),
    WorkspacesModule,
    BillingModule,
  ],
  controllers: [
    WorkspaceDriveController,
    GoogleDriveCallbackController,
    ProjectDriveController,
  ],
  providers: [GoogleDriveService],
  exports: [GoogleDriveService],
})
export class GoogleDriveModule {}
