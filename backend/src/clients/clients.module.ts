import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './client.entity';
import { ClientPortalInvite } from './entities/client-portal-invite.entity';
import { ClientsService } from './clients.service';
import { ClientsController, PublicClientInviteController, AuthenticatedClientInviteController } from './clients.controller';
import { Workspace } from '../workspaces/workspace.entity';
import { WorkspaceMember } from '../workspaces/workspace-member.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, ClientPortalInvite, Workspace, WorkspaceMember]),
    WorkspacesModule,
    UsersModule,
  ],
  controllers: [ClientsController, PublicClientInviteController, AuthenticatedClientInviteController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
