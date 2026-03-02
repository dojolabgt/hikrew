import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './service.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Service]),
        WorkspacesModule,
    ],
    controllers: [ServicesController],
    providers: [ServicesService],
    exports: [ServicesService],
})
export class ServicesModule { }
