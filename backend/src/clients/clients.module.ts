import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './client.entity';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { Workspace } from '../workspaces/workspace.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Client, Workspace]),
        WorkspacesModule,
    ],
    controllers: [ClientsController],
    providers: [ClientsService],
    exports: [ClientsService],
})
export class ClientsModule { }
