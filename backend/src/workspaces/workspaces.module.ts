import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './workspace.entity';
import { WorkspaceMember } from './workspace-member.entity';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { StorageModule } from '../storage/storage.module';
import { EncryptionModule } from '../common/encryption/encryption.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Workspace, WorkspaceMember]),
        StorageModule,
        EncryptionModule,
    ],
    controllers: [WorkspacesController],
    providers: [WorkspacesService],
    exports: [WorkspacesService],
})
export class WorkspacesModule { }
