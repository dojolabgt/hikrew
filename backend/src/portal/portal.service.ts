import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Deal } from '../deals/entities/deal.entity';
import { Client } from '../clients/client.entity';
import { GoogleDriveService } from '../google-drive/google-drive.service';

@Injectable()
export class PortalService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepo: Repository<Deal>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    private readonly driveService: GoogleDriveService,
  ) {}

  private async getClientIds(userId: string): Promise<string[]> {
    const clients = await this.clientRepo.find({
      where: { linkedUserId: userId },
      select: ['id'],
    });
    return clients.map((c) => c.id);
  }

  /**
   * Finds all deals for clients linked to the given user ID.
   */
  async getDealsForUser(userId: string): Promise<Deal[]> {
    const clientIds = await this.getClientIds(userId);
    if (clientIds.length === 0) return [];

    return this.dealRepo
      .createQueryBuilder('deal')
      .leftJoinAndSelect('deal.workspace', 'workspace')
      .leftJoinAndSelect('deal.brief', 'brief')
      .leftJoinAndSelect('deal.quotations', 'quotations')
      .leftJoinAndSelect('deal.paymentPlan', 'paymentPlan')
      .leftJoinAndSelect('paymentPlan.milestones', 'milestones')
      .where('deal.clientId IN (:...clientIds)', { clientIds })
      .orderBy('deal.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Get full deal detail by publicToken, verifying user has access.
   */
  async getDealByToken(userId: string, publicToken: string): Promise<Deal> {
    const clientIds = await this.getClientIds(userId);
    if (clientIds.length === 0) throw new NotFoundException('Deal no encontrado');

    const deal = await this.dealRepo
      .createQueryBuilder('deal')
      .leftJoinAndSelect('deal.workspace', 'workspace')
      .leftJoinAndSelect('deal.client', 'client')
      .leftJoinAndSelect('deal.brief', 'brief')
      .leftJoinAndSelect('brief.template', 'template')
      .leftJoinAndSelect('deal.quotations', 'quotations')
      .leftJoinAndSelect('quotations.items', 'items')
      .leftJoinAndSelect('deal.paymentPlan', 'paymentPlan')
      .leftJoinAndSelect('paymentPlan.milestones', 'milestones')
      .leftJoinAndSelect('deal.project', 'project')
      .where('deal.publicToken = :publicToken', { publicToken })
      .andWhere('deal.clientId IN (:...clientIds)', { clientIds })
      .getOne();

    if (!deal) throw new NotFoundException('Deal no encontrado');
    return deal;
  }

  /**
   * List Drive files for the project linked to this deal.
   */
  async getDealAssets(userId: string, publicToken: string): Promise<any[]> {
    const deal = await this.getDealByToken(userId, publicToken);
    if (!deal.project?.driveFolderId) return [];
    return this.driveService.getFiles(deal.workspaceId, deal.project.id);
  }

  /**
   * Upload a file to the project's Drive folder.
   */
  async uploadDealAsset(
    userId: string,
    publicToken: string,
    file: Express.Multer.File,
  ): Promise<any> {
    const deal = await this.getDealByToken(userId, publicToken);
    if (!deal.project?.driveFolderId) {
      throw new BadRequestException(
        'El proyecto no tiene carpeta de Google Drive configurada. Contacta a tu freelancer.',
      );
    }
    return this.driveService.uploadFile(deal.workspaceId, deal.project.id, file);
  }
}
