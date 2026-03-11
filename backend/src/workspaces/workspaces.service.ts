import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './workspace.entity';
import { WorkspaceMember, WorkspaceRole } from './workspace-member.entity';
import { EncryptionService } from '../common/encryption/encryption.service';
import { StorageService } from '../storage/storage.service';
import { storageConfig } from '../storage/storage.config';

export interface UpdateRecurrenteKeysDto {
  publicKey: string;
  privateKey: string;
}

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private workspacesRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private workspaceMembersRepository: Repository<WorkspaceMember>,
    private readonly encryptionService: EncryptionService,
    private readonly storageService: StorageService,
  ) {}

  async createDefaultWorkspace(userId: string): Promise<Workspace> {
    const existingOwner = await this.workspaceMembersRepository.findOne({
      where: { userId, role: WorkspaceRole.OWNER },
    });

    if (existingOwner) {
      throw new BadRequestException('A user can only own one Workspace');
    }

    const workspace = this.workspacesRepository.create({
      businessName: 'Mi Espacio',
    });
    const savedWorkspace = await this.workspacesRepository.save(workspace);

    const member = this.workspaceMembersRepository.create({
      userId,
      workspaceId: savedWorkspace.id,
      role: WorkspaceRole.OWNER,
    });
    await this.workspaceMembersRepository.save(member);

    return savedWorkspace;
  }

  async findByUserId(userId: string): Promise<WorkspaceMember[]> {
    return this.workspaceMembersRepository.find({
      where: { userId },
      relations: ['workspace'],
    });
  }

  async getWorkspaceById(id: string): Promise<Workspace> {
    const workspace = await this.workspacesRepository.findOne({
      where: { id },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  private readonly logger = new Logger(WorkspacesService.name);

  async updateWorkspace(
    id: string,
    data: Partial<Workspace>,
  ): Promise<Workspace> {
    this.logger.log(
      `Updating workspace ${id} with data: ${JSON.stringify(data)}`,
    );
    await this.workspacesRepository.update(id, data);
    return this.getWorkspaceById(id);
  }

  async uploadLogo(id: string, file: Express.Multer.File): Promise<Workspace> {
    const workspace = await this.getWorkspaceById(id);
    if (workspace.logo) {
      try {
        await this.storageService.delete(workspace.logo);
      } catch {
        // Log error but continue
      }
    }
    const uploadResult = await this.storageService.upload(
      file,
      storageConfig.folders.profileImages,
    );
    await this.workspacesRepository.update(id, { logo: uploadResult.url });
    return this.getWorkspaceById(id);
  }

  async updateRecurrenteKeys(id: string, dto: UpdateRecurrenteKeysDto) {
    if (!dto.publicKey || !dto.privateKey) {
      throw new BadRequestException(
        'Both publicKey and privateKey are required',
      );
    }
    const encryptedPublic = this.encryptionService.encrypt(dto.publicKey);
    const encryptedPrivate = this.encryptionService.encrypt(dto.privateKey);

    await this.workspacesRepository.update(id, {
      recurrentePublicKey: encryptedPublic,
      recurrentePrivateKey: encryptedPrivate,
    });
  }

  async getRecurrenteStatus(id: string): Promise<{ configured: boolean }> {
    // Select the encrypted fields explicitly since they might have select: false
    const workspace = await this.workspacesRepository.findOne({
      where: { id },
      select: ['id', 'recurrentePublicKey', 'recurrentePrivateKey'],
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    return {
      configured: !!(
        workspace.recurrentePublicKey && workspace.recurrentePrivateKey
      ),
    };
  }
}
