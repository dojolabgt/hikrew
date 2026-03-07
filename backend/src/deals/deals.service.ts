import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deal } from './entities/deal.entity';
import { BriefTemplate } from './entities/brief-template.entity';
import { Workspace } from '../workspaces/workspace.entity';
import { Client } from '../clients/client.entity';
import { CreateDealDto } from './dto/create-deal.dto';
import { CreateBriefTemplateDto } from './dto/create-brief-template.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { DealStatus } from './enums/deal-status.enum';
import { WorkspacePlan } from '../workspaces/workspace.entity';

@Injectable()
export class DealsService {
    constructor(
        @InjectRepository(Deal)
        private readonly dealsRepository: Repository<Deal>,
        @InjectRepository(BriefTemplate)
        private readonly briefTemplatesRepository: Repository<BriefTemplate>,
        @InjectRepository(Workspace)
        private readonly workspacesRepository: Repository<Workspace>,
        @InjectRepository(Client)
        private readonly clientsRepository: Repository<Client>,
    ) { }

    async create(workspaceId: string, createDealDto: CreateDealDto): Promise<Deal> {
        const workspace = await this.workspacesRepository.findOne({
            where: { id: workspaceId },
            relations: ['taxes'], // Need to snapshot active taxes
        });

        if (!workspace) {
            throw new NotFoundException('Workspace not found');
        }

        const client = await this.clientsRepository.findOne({
            where: { id: createDealDto.clientId, workspace: { id: workspaceId } },
        });

        if (!client) {
            throw new NotFoundException('Client not found in this workspace');
        }

        // Build the immutable snapshot from current active workspace settings
        const activeTaxes = workspace.taxes?.filter(t => t.isActive) || [];

        const deal = this.dealsRepository.create({
            name: createDealDto.title, // Client sees it as title in DTO, DB uses name
            status: DealStatus.DRAFT,
            workspace: { id: workspaceId },
            client: { id: createDealDto.clientId },
            currency: { code: 'USD', symbol: '$' },
            taxes: activeTaxes.map(t => ({
                id: t.id,
                key: t.key,
                label: t.label,
                rate: t.rate,
                appliesTo: t.appliesTo
            })),
        });

        return await this.dealsRepository.save(deal);
    }

    async findAll(workspaceId: string): Promise<Deal[]> {
        return this.dealsRepository.find({
            where: { workspace: { id: workspaceId } },
            relations: ['client', 'brief', 'quotations', 'paymentPlan'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(workspaceId: string, dealId: string): Promise<Deal> {
        const deal = await this.dealsRepository.findOne({
            where: { id: dealId, workspace: { id: workspaceId } },
            relations: ['client', 'brief', 'quotations', 'quotations.items', 'paymentPlan', 'paymentPlan.milestones'],
        });

        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        return deal;
    }

    async update(workspaceId: string, dealId: string, updateDealDto: UpdateDealDto): Promise<Deal> {
        const deal = await this.findOne(workspaceId, dealId);

        if (updateDealDto.name !== undefined) deal.name = updateDealDto.name;
        if (updateDealDto.status !== undefined) deal.status = updateDealDto.status;

        // If a briefTemplateId is passed, we update the relationship or create a brief if necessary
        // In a real application, you might create the full 'Brief' entity here rather than just keeping a reference.
        // For now, depending on your schema design, you might just want to store currentStep on the Deal or Brief.
        // Let's assume you save it to the deal entity later or create the Brief entity.

        return await this.dealsRepository.save(deal);
    }

    // --- BRIEF TEMPLATES ---

    async createBriefTemplate(workspaceId: string, dto: CreateBriefTemplateDto): Promise<BriefTemplate> {
        const workspace = await this.workspacesRepository.findOne({ where: { id: workspaceId } });
        if (!workspace) throw new NotFoundException('Workspace not found');

        const currentTemplatesCount = await this.briefTemplatesRepository.count({
            where: { workspace: { id: workspaceId } }
        });

        // Limits based on plan
        const planLimits = {
            [WorkspacePlan.FREE]: 2,
            [WorkspacePlan.PRO]: 12,
            [WorkspacePlan.PREMIUM]: 30,
        };

        const limit = planLimits[workspace.plan] || planLimits[WorkspacePlan.FREE];

        if (currentTemplatesCount >= limit) {
            throw new BadRequestException(`Límite de plantillas alcanzado para el plan ${workspace.plan}. Máximo permitido: ${limit}`);
        }

        const template = this.briefTemplatesRepository.create({
            ...dto,
            workspace: { id: workspaceId }
        });
        return await this.briefTemplatesRepository.save(template);
    }

    async findAllBriefTemplates(workspaceId: string): Promise<BriefTemplate[]> {
        return this.briefTemplatesRepository.find({
            where: { workspace: { id: workspaceId } },
            order: { createdAt: 'DESC' },
        });
    }

    async findOneBriefTemplate(workspaceId: string, id: string): Promise<BriefTemplate> {
        const template = await this.briefTemplatesRepository.findOne({
            where: { id, workspace: { id: workspaceId } }
        });
        if (!template) throw new NotFoundException('Template not found');
        return template;
    }

    async updateBriefTemplate(workspaceId: string, id: string, dto: Partial<CreateBriefTemplateDto>): Promise<BriefTemplate> {
        const template = await this.findOneBriefTemplate(workspaceId, id);
        Object.assign(template, dto);
        return await this.briefTemplatesRepository.save(template);
    }

    async deleteDeal(workspaceId: string, dealId: string): Promise<void> {
        const deal = await this.dealsRepository.findOne({
            where: { id: dealId, workspace: { id: workspaceId } },
        });
        if (!deal) {
            throw new NotFoundException('Deal not found');
        }
        await this.dealsRepository.remove(deal);
    }
}
