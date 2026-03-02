import {
    Controller,
    Get,
    Patch,
    Post,
    Body,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FreelancerProfileService } from './freelancer-profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/constants/roles';
import { UpdateFreelancerProfileDto } from './dto/update-profile.dto';
import { UpdateRecurrenteKeysDto } from './dto/update-recurrente-keys.dto';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFileFilter } from '../storage/validators/image-file.validator';
import { storageConfig } from '../storage/storage.config';

@Controller('me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.FREELANCER)
export class FreelancerProfileController {
    constructor(private readonly profileService: FreelancerProfileService) { }

    @Get('profile')
    getProfile(@Req() req: RequestWithUser) {
        return this.profileService.findByUserId(req.user!.id);
    }

    @Patch('profile')
    updateProfile(
        @Req() req: RequestWithUser,
        @Body() dto: UpdateFreelancerProfileDto,
    ) {
        return this.profileService.update(req.user!.id, dto);
    }

    @Patch('recurrente-keys')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateRecurrenteKeys(
        @Req() req: RequestWithUser,
        @Body() dto: UpdateRecurrenteKeysDto,
    ) {
        await this.profileService.updateRecurrenteKeys(req.user!.id, dto);
    }

    @Get('recurrente-status')
    getRecurrenteStatus(@Req() req: RequestWithUser) {
        return this.profileService.getRecurrenteStatus(req.user!.id);
    }

    @Post('profile/logo')
    @UseInterceptors(
        FileInterceptor('file', {
            fileFilter: imageFileFilter,
            limits: { fileSize: storageConfig.maxFileSize },
        }),
    )
    async uploadLogo(
        @Req() req: RequestWithUser,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('No se proporcionó ningún archivo de imagen para el logo');
        }

        return this.profileService.uploadLogo(req.user!.id, file);
    }
}
