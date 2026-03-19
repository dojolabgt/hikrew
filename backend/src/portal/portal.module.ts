import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { Deal } from '../deals/entities/deal.entity';
import { Client } from '../clients/client.entity';
import { Project } from '../projects/entities/project.entity';
import { GoogleDriveModule } from '../google-drive/google-drive.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deal, Client, Project]),
    GoogleDriveModule,
  ],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
