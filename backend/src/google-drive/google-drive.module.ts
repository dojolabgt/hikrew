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

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, Project]),
    WorkspacesModule, // for WorkspaceGuard
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
