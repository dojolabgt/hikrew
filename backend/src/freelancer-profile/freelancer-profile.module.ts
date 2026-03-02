import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FreelancerProfile } from './freelancer-profile.entity';
import { FreelancerProfileService } from './freelancer-profile.service';
import { FreelancerProfileController } from './freelancer-profile.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([FreelancerProfile]),
        StorageModule,
    ],
    providers: [FreelancerProfileService],
    controllers: [FreelancerProfileController],
    exports: [FreelancerProfileService],
})
export class FreelancerProfileModule { }
