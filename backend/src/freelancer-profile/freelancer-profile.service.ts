import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FreelancerProfile } from './freelancer-profile.entity';
import { EncryptionService } from '../common/encryption/encryption.service';
import { UpdateFreelancerProfileDto } from './dto/update-profile.dto';
import { UpdateRecurrenteKeysDto } from './dto/update-recurrente-keys.dto';

import { StorageService } from '../storage/storage.service';

@Injectable()
export class FreelancerProfileService {
    private readonly logger = new Logger(FreelancerProfileService.name);

    constructor(
        @InjectRepository(FreelancerProfile)
        private readonly profileRepository: Repository<FreelancerProfile>,
        private readonly encryptionService: EncryptionService,
        private readonly storageService: StorageService,
    ) { }

    /**
     * Creates an empty FreelancerProfile for a user.
     * Called automatically after a FREELANCER registers.
     */
    async create(userId: string): Promise<FreelancerProfile> {
        const profile = this.profileRepository.create({ userId });
        return this.profileRepository.save(profile);
    }

    /**
     * Finds a freelancer profile by userId.
     * Does NOT include encrypted Recurrente keys.
     */
    async findByUserId(userId: string): Promise<FreelancerProfile> {
        const profile = await this.profileRepository.findOne({
            where: { userId },
        });
        if (!profile) {
            throw new NotFoundException('Freelancer profile not found');
        }
        return profile;
    }

    /**
     * Updates editable profile fields (businessName, logo, brandColor).
     */
    async update(
        userId: string,
        dto: UpdateFreelancerProfileDto,
    ): Promise<FreelancerProfile> {
        const profile = await this.findByUserId(userId);
        Object.assign(profile, dto);
        return this.profileRepository.save(profile);
    }

    /**
     * Encrypts and stores Recurrente API keys.
     * Keys are never returned after this point.
     */
    async updateRecurrenteKeys(
        userId: string,
        dto: UpdateRecurrenteKeysDto,
    ): Promise<void> {
        const profile = await this.findByUserId(userId);

        const encryptedPublic = this.encryptionService.encrypt(dto.publicKey);
        const encryptedPrivate = this.encryptionService.encrypt(dto.privateKey);

        await this.profileRepository.update(profile.id, {
            recurrentePublicKey: encryptedPublic,
            recurrentePrivateKey: encryptedPrivate,
        });

        this.logger.log(`Recurrente keys updated for userId: ${userId}`);
    }

    /**
     * Returns whether Recurrente keys have been configured.
     * Never exposes the actual keys.
     */
    async getRecurrenteStatus(userId: string): Promise<{ configured: boolean }> {
        const profile = await this.profileRepository.findOne({
            where: { userId },
            select: ['id', 'recurrentePublicKey', 'recurrentePrivateKey'],
        });

        if (!profile) {
            return { configured: false };
        }

        const configured =
            this.encryptionService.isEncrypted(profile.recurrentePublicKey) &&
            this.encryptionService.isEncrypted(profile.recurrentePrivateKey);

        return { configured };
    }

    /**
     * Decrypts and returns raw Recurrente keys for internal use only.
     * NEVER use this in a controller response.
     */
    async getDecryptedKeys(
        userId: string,
    ): Promise<{ publicKey: string; privateKey: string }> {
        const profile = await this.profileRepository.findOne({
            where: { userId },
            select: ['id', 'recurrentePublicKey', 'recurrentePrivateKey'],
        });

        if (!profile?.recurrentePublicKey || !profile?.recurrentePrivateKey) {
            throw new NotFoundException(
                'Recurrente keys not configured for this freelancer',
            );
        }

        return {
            publicKey: this.encryptionService.decrypt(profile.recurrentePublicKey),
            privateKey: this.encryptionService.decrypt(profile.recurrentePrivateKey),
        };
    }

    /**
     * Uploads a logo image via StorageService and updates the freelancer profile.
     */
    async uploadLogo(
        userId: string,
        file: Express.Multer.File,
    ): Promise<FreelancerProfile> {
        const profile = await this.findByUserId(userId);

        const uploadResult = await this.storageService.upload(
            file,
            'brand-logos',
        );

        profile.logo = uploadResult.url;
        this.logger.log(`Logo uploaded for userId: ${userId} at ${profile.logo}`);

        return this.profileRepository.save(profile);
    }
}
