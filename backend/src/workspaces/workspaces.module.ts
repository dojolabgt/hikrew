import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './workspace.entity';
import { WorkspaceMember } from './workspace-member.entity';
import { WorkspaceTax } from './workspace-tax.entity';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceTaxesController } from './workspace-taxes.controller';
import { WorkspaceTaxesService } from './workspace-taxes.service';
import { StorageModule } from '../storage/storage.module';
import { EncryptionModule } from '../common/encryption/encryption.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, WorkspaceMember, WorkspaceTax]),
    StorageModule,
    EncryptionModule,
  ],
  controllers: [WorkspacesController, WorkspaceTaxesController],
  providers: [WorkspacesService, WorkspaceTaxesService],
  exports: [WorkspacesService, WorkspaceTaxesService],
})
export class WorkspacesModule {}
