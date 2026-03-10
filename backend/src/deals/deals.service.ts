import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deal } from './entities/deal.entity';
import { Brief } from './entities/brief.entity';
import { BriefTemplate } from './entities/brief-template.entity';
import { Quotation } from './entities/quotation.entity';
import { QuotationItem } from './entities/quotation-item.entity';
import { PaymentPlan } from './entities/payment-plan.entity';
import { PaymentMilestone } from './entities/payment-milestone.entity';
import { Workspace } from '../workspaces/workspace.entity';
import { Client } from '../clients/client.entity';
import { Service } from '../services/service.entity';
import { CreateDealDto } from './dto/create-deal.dto';
import { CreateBriefTemplateDto } from './dto/create-brief-template.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { DealStatus } from './enums/deal-status.enum';
import { WorkspacePlan } from '../workspaces/workspace.entity';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { AddQuotationItemDto } from './dto/add-quotation-item.dto';
import { UpdateQuotationItemDto } from './dto/update-quotation-item.dto';
import {
  CreatePaymentPlanDto,
  UpdateMilestoneDto,
  CreateMilestoneDto,
} from './dto/payment-plan.dto';

// ─── Slug generator ────────────────────────────────────────────────────────
function generateSlug(name: string): string {
  // Normalize accented chars, lowercase, replace non-alphanumeric with dashes
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric → dash
    .replace(/^-+|-+$/g, '') // trim leading/trailing dashes
    .slice(0, 40); // max 40 chars for the base
  // Add 6-char random suffix
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealsRepository: Repository<Deal>,
    @InjectRepository(Brief)
    private readonly briefsRepository: Repository<Brief>,
    @InjectRepository(BriefTemplate)
    private readonly briefTemplatesRepository: Repository<BriefTemplate>,
    @InjectRepository(Quotation)
    private readonly quotationsRepository: Repository<Quotation>,
    @InjectRepository(QuotationItem)
    private readonly quotationItemsRepository: Repository<QuotationItem>,
    @InjectRepository(PaymentPlan)
    private readonly paymentPlansRepository: Repository<PaymentPlan>,
    @InjectRepository(PaymentMilestone)
    private readonly paymentMilestonesRepository: Repository<PaymentMilestone>,
    @InjectRepository(Workspace)
    private readonly workspacesRepository: Repository<Workspace>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
  ) { }

  // ─── DEALS ───────────────────────────────────────────────────────────────

  async create(
    workspaceId: string,
    createDealDto: CreateDealDto,
  ): Promise<Deal> {
    const workspace = await this.workspacesRepository.findOne({
      where: { id: workspaceId },
      relations: ['taxes'],
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    const client = await this.clientsRepository.findOne({
      where: { id: createDealDto.clientId, workspace: { id: workspaceId } },
    });

    if (!client)
      throw new NotFoundException('Client not found in this workspace');

    const activeTaxes = workspace.taxes?.filter((t) => t.isActive) || [];

    // Read the workspace's default currency from Settings instead of hardcoding USD
    const defaultCurrency =
      workspace.currencies?.find((c) => c.isDefault) ??
      workspace.currencies?.[0] ??
      { code: 'USD', symbol: '$', name: 'US Dollar' };

    const deal = this.dealsRepository.create({
      name: createDealDto.title,
      slug: generateSlug(createDealDto.title),
      publicToken: crypto.randomUUID(),
      notes: createDealDto.notes,
      status: DealStatus.DRAFT,
      currentStep: 'brief',
      workspace: { id: workspaceId },
      client: { id: createDealDto.clientId },
      currency: {
        code: defaultCurrency.code,
        symbol: defaultCurrency.symbol,
        name: defaultCurrency.name,
      },
      taxes: activeTaxes.map((t) => ({
        id: t.id,
        key: t.key,
        label: t.label,
        rate: t.rate,
        appliesTo: t.appliesTo,
      })),
      proposalTerms: workspace.defaultProposalTerms || undefined,
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
    // Accept slug OR uuid — try slug first, fallback to uuid for backward-compat
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        dealId,
      );

    let deal: Deal | null = null;

    if (!isUuid) {
      // Slug lookup
      deal = await this.dealsRepository.findOne({
        where: { slug: dealId, workspace: { id: workspaceId } },
        relations: [
          'client',
          'brief',
          'brief.template',
          'quotations',
          'quotations.items',
          'paymentPlan',
          'paymentPlan.milestones',
        ],
      });
    } else {
      deal = await this.dealsRepository.findOne({
        where: { id: dealId, workspace: { id: workspaceId } },
        relations: [
          'client',
          'brief',
          'brief.template',
          'quotations',
          'quotations.items',
          'paymentPlan',
          'paymentPlan.milestones',
        ],
      });
    }

    if (!deal) throw new NotFoundException('Deal not found');

    // Retroactive publicToken generation for older deals
    if (!deal.publicToken) {
      deal.publicToken = crypto.randomUUID();
      await this.dealsRepository.save(deal);
    }

    return deal;
  }

  async update(
    workspaceId: string,
    dealId: string,
    updateDealDto: UpdateDealDto,
  ): Promise<Deal> {
    const deal = await this.findOne(workspaceId, dealId);

    if (updateDealDto.name !== undefined) deal.name = updateDealDto.name;
    if (updateDealDto.status !== undefined) deal.status = updateDealDto.status;
    if (updateDealDto.notes !== undefined) deal.notes = updateDealDto.notes;
    if (updateDealDto.currentStep !== undefined)
      deal.currentStep = updateDealDto.currentStep;
    if (updateDealDto.proposalIntro !== undefined)
      deal.proposalIntro = updateDealDto.proposalIntro;
    if (updateDealDto.proposalTerms !== undefined)
      deal.proposalTerms = updateDealDto.proposalTerms;
    if (updateDealDto.validUntil !== undefined)
      deal.validUntil = updateDealDto.validUntil ? new Date(updateDealDto.validUntil) : undefined as any;

    if (updateDealDto.briefTemplateId !== undefined) {
      // Upsert the Brief linked to this deal
      let brief = await this.briefsRepository.findOne({
        where: { deal: { id: deal.id } },
      });
      if (!brief) {
        // Validate template exists (optional if null, that means "no brief")
        brief = this.briefsRepository.create({
          dealId: deal.id,
          deal: { id: deal.id } as any,
          templateId: updateDealDto.briefTemplateId || undefined,
          publicToken: crypto.randomUUID(),
          responses: {},
          isCompleted: false,
        });
      } else {
        brief.templateId = updateDealDto.briefTemplateId || brief.templateId;
      }
      await this.briefsRepository.save(brief);
    }

    if (updateDealDto.status === DealStatus.WON) {
      deal.wonAt = new Date();
    }
    if (updateDealDto.status === DealStatus.SENT) {
      deal.sentAt = new Date();
    }

    return await this.dealsRepository.save(deal);
  }

  async deleteDeal(workspaceId: string, dealId: string): Promise<void> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        dealId,
      );

    const deal = await this.dealsRepository.findOne({
      where: isUuid
        ? { id: dealId, workspace: { id: workspaceId } }
        : { slug: dealId, workspace: { id: workspaceId } },
    });
    if (!deal) throw new NotFoundException('Deal not found');
    await this.dealsRepository.remove(deal);
  }

  // ─── QUOTATIONS ──────────────────────────────────────────────────────────

  private async findDealOrFail(
    workspaceId: string,
    dealId: string,
  ): Promise<Deal> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        dealId,
      );

    const deal = await this.dealsRepository.findOne({
      where: isUuid
        ? { id: dealId, workspace: { id: workspaceId } }
        : { slug: dealId, workspace: { id: workspaceId } },
    });
    if (!deal) throw new NotFoundException('Deal not found');
    return deal;
  }

  // ─── PUBLIC BRIEFS ───────────────────────────────────────────────────────

  async getPublicBrief(token: string): Promise<Brief> {
    const brief = await this.briefsRepository.findOne({
      where: { publicToken: token },
      relations: ['template', 'deal', 'deal.workspace', 'deal.client'],
    });
    if (!brief)
      throw new NotFoundException('Brief no encontrado o token inválido');
    return brief;
  }

  async submitPublicBrief(
    token: string,
    responses: any,
  ): Promise<{ success: boolean }> {
    const brief = await this.getPublicBrief(token);

    brief.responses = responses;
    brief.isCompleted = true;
    await this.briefsRepository.save(brief);

    // Optionally advance the deal step to quotation if it was waiting on the brief
    if (brief.deal && brief.deal.currentStep === 'brief') {
      brief.deal.currentStep = 'quotation';
      await this.dealsRepository.save(brief.deal);
    }

    return { success: true };
  }

  // ─── PUBLIC DEALS & QUOTATIONS ───────────────────────────────────────────

  async getPublicDeal(publicToken: string): Promise<Deal> {
    const deal = await this.dealsRepository.findOne({
      where: { publicToken },
      relations: [
        'workspace',
        'client',
        'brief',
        // Fetch quotations so customer sees their options
        'quotations',
        'quotations.items',
      ],
    });

    if (!deal) throw new NotFoundException('Propuesta no encontrada');
    return deal;
  }

  async approvePublicQuotation(
    publicToken: string,
    quotationId: string,
  ): Promise<{ success: boolean; dealId: string; status: string }> {
    const deal = await this.dealsRepository.findOne({
      where: { publicToken },
      relations: ['quotations'],
    });

    if (!deal) {
      throw new NotFoundException('Propuesta no encontrada');
    }

    const quotation = deal.quotations.find((q) => q.id === quotationId);
    if (!quotation) {
      throw new NotFoundException(
        'La opción de cotización seleccionada no existe para esta propuesta',
      );
    }

    if (deal.status === DealStatus.WON) {
      throw new BadRequestException('Esta propuesta ya fue aceptada');
    }

    // 1) Mark all other quotations as not approved, mark the selected one as approved
    for (const q of deal.quotations) {
      q.isApproved = q.id === quotationId;
      await this.quotationsRepository.save(q);
    }

    // 2) Move deal to WON
    deal.status = DealStatus.WON;
    deal.wonAt = new Date();
    deal.currentStep = 'won';
    await this.dealsRepository.save(deal);

    return { success: true, dealId: deal.id, status: deal.status };
  }

  // ─── QUOTATIONS ──────────────────────────────────────────────────────────

  async createQuotation(
    workspaceId: string,
    dealId: string,
    dto: CreateQuotationDto,
  ): Promise<Quotation> {
    await this.findDealOrFail(workspaceId, dealId);

    const existing = await this.quotationsRepository.count({
      where: { deal: { id: dealId } },
    });
    const optionName =
      dto.optionName || `Opción ${String.fromCharCode(65 + existing)}`; // A, B, C...

    const quotation = this.quotationsRepository.create({
      deal: { id: dealId },
      optionName,
      description: dto.description,
    });

    return await this.quotationsRepository.save(quotation);
  }

  async findAllQuotations(
    workspaceId: string,
    dealId: string,
  ): Promise<Quotation[]> {
    await this.findDealOrFail(workspaceId, dealId);
    return this.quotationsRepository.find({
      where: { deal: { id: dealId } },
      relations: ['items'],
      order: { createdAt: 'ASC' },
    });
  }

  async updateQuotation(
    workspaceId: string,
    dealId: string,
    quotationId: string,
    dto: UpdateQuotationDto,
  ): Promise<Quotation> {
    await this.findDealOrFail(workspaceId, dealId);

    const quotation = await this.quotationsRepository.findOne({
      where: { id: quotationId, deal: { id: dealId } },
      relations: ['items'],
    });
    if (!quotation) throw new NotFoundException('Quotation not found');

    if (dto.optionName !== undefined) quotation.optionName = dto.optionName;
    if (dto.description !== undefined) quotation.description = dto.description;
    if (dto.currency !== undefined) quotation.currency = dto.currency || null;
    if (dto.discount !== undefined) quotation.discount = dto.discount;
    if (dto.isApproved !== undefined) {
      // Only one quotation per deal can be approved
      if (dto.isApproved) {
        await this.quotationsRepository.update(
          { deal: { id: dealId } },
          { isApproved: false },
        );
      }
      quotation.isApproved = dto.isApproved;
    }

    const saved = await this.quotationsRepository.save(quotation);
    return this.recalculateQuotationTotals(saved);
  }

  async deleteQuotation(
    workspaceId: string,
    dealId: string,
    quotationId: string,
  ): Promise<void> {
    await this.findDealOrFail(workspaceId, dealId);
    const quotation = await this.quotationsRepository.findOne({
      where: { id: quotationId, deal: { id: dealId } },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    await this.quotationsRepository.remove(quotation);
  }

  // ─── QUOTATION ITEMS ─────────────────────────────────────────────────────

  private async findQuotationOrFail(
    dealId: string,
    quotationId: string,
  ): Promise<Quotation> {
    const quotation = await this.quotationsRepository.findOne({
      where: { id: quotationId, deal: { id: dealId } },
      relations: ['items'],
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    return quotation;
  }

  async addItem(
    workspaceId: string,
    dealId: string,
    quotationId: string,
    dto: AddQuotationItemDto,
  ): Promise<Quotation> {
    await this.findDealOrFail(workspaceId, dealId);
    const quotation = await this.findQuotationOrFail(dealId, quotationId);

    let itemData: Partial<QuotationItem> = {
      quotation: { id: quotationId } as any,
      name: dto.name || 'Item sin nombre',
      description: dto.description,
      price: dto.price ?? 0,
      quantity: dto.quantity ?? 1,
      chargeType: dto.chargeType,
      unitType: dto.unitType,
      isTaxable: dto.isTaxable ?? true,
      discount: dto.discount ?? 0,
      internalCost: 0,
    };

    // If serviceId provided, snapshot the service data
    if (dto.serviceId) {
      const service = await this.servicesRepository.findOne({
        where: { id: dto.serviceId, workspaceId },
      });
      if (!service)
        throw new NotFoundException('Service not found in this workspace');

      itemData = {
        ...itemData,
        serviceId: service.id,
        name: dto.name ?? service.name,
        description: dto.description ?? service.description,
        price: dto.price ?? Number(service.basePrice),
        chargeType: dto.chargeType ?? service.chargeType,
        unitType: dto.unitType ?? service.unitType,
        isTaxable:
          dto.isTaxable !== undefined ? dto.isTaxable : service.isTaxable,
        internalCost: Number(service.internalCost),
      };
    }

    const item = this.quotationItemsRepository.create(
      itemData as QuotationItem,
    );
    await this.quotationItemsRepository.save(item);

    return this.recalculateQuotationTotals(quotation);
  }

  async updateItem(
    workspaceId: string,
    dealId: string,
    quotationId: string,
    itemId: string,
    dto: UpdateQuotationItemDto,
  ): Promise<Quotation> {
    await this.findDealOrFail(workspaceId, dealId);
    const quotation = await this.findQuotationOrFail(dealId, quotationId);

    const item = await this.quotationItemsRepository.findOne({
      where: { id: itemId, quotation: { id: quotationId } },
    });
    if (!item) throw new NotFoundException('Item not found');

    Object.assign(item, dto);
    await this.quotationItemsRepository.save(item);

    return this.recalculateQuotationTotals(quotation);
  }

  async deleteItem(
    workspaceId: string,
    dealId: string,
    quotationId: string,
    itemId: string,
  ): Promise<Quotation> {
    await this.findDealOrFail(workspaceId, dealId);
    const quotation = await this.findQuotationOrFail(dealId, quotationId);

    const item = await this.quotationItemsRepository.findOne({
      where: { id: itemId, quotation: { id: quotationId } },
    });
    if (!item) throw new NotFoundException('Item not found');

    await this.quotationItemsRepository.remove(item);

    // Reload quotation after delete
    const reloaded = await this.findQuotationOrFail(dealId, quotationId);
    return this.recalculateQuotationTotals(reloaded);
  }

  /** Recalculates and persists subtotal, taxTotal, discount, total on a Quotation */
  private async recalculateQuotationTotals(
    quotation: Quotation,
  ): Promise<Quotation> {
    const items = await this.quotationItemsRepository.find({
      where: { quotation: { id: quotation.id } },
    });

    let subtotal = 0;
    let itemDiscountTotal = 0;

    for (const item of items) {
      const lineTotal = Number(item.price) * Number(item.quantity);
      subtotal += lineTotal;
      itemDiscountTotal += Number(item.discount);
    }

    const discount = itemDiscountTotal + Number(quotation.discount || 0);
    // taxTotal: placeholder — actual tax logic will use the deal's tax snapshot (handled in future)
    const taxTotal = 0;
    const total = Math.max(0, subtotal - discount + taxTotal);

    quotation.subtotal = subtotal;
    quotation.discount = discount;
    quotation.taxTotal = taxTotal;
    quotation.total = total;

    // Prevent TypeORM cascade from trying to detach/delete items that aren't in the loaded relation
    quotation.items = undefined as any;

    const saved = await this.quotationsRepository.save(quotation);
    saved.items = items; // Attach fresh items array for the response
    return saved;
  }

  // ─── PAYMENT PLAN ────────────────────────────────────────────────────────

  async createOrUpdatePaymentPlan(
    workspaceId: string,
    dealId: string,
    dto: CreatePaymentPlanDto,
  ): Promise<PaymentPlan> {
    await this.findDealOrFail(workspaceId, dealId);

    // Check if plan already exists, delete it (full replace pattern)
    const existing = await this.paymentPlansRepository.findOne({
      where: { deal: { id: dealId } },
      relations: ['milestones'],
    });
    if (existing) {
      await this.paymentPlansRepository.remove(existing);
    }

    const totalAmount = dto.milestones.reduce(
      (sum, m) => sum + Number(m.amount),
      0,
    );

    const plan = this.paymentPlansRepository.create({
      deal: { id: dealId },
      quotationId: dto.quotationId,
      totalAmount,
      milestones: dto.milestones.map((m) =>
        this.paymentMilestonesRepository.create({
          name: m.name,
          percentage: m.percentage,
          amount: m.amount,
          description: m.description,
          dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
        }),
      ),
    });

    return this.paymentPlansRepository.save(plan);
  }

  async findPaymentPlan(
    workspaceId: string,
    dealId: string,
  ): Promise<PaymentPlan> {
    await this.findDealOrFail(workspaceId, dealId);
    const plan = await this.paymentPlansRepository.findOne({
      where: { deal: { id: dealId } },
      relations: ['milestones'],
      order: { createdAt: 'DESC' },
    });
    if (!plan) throw new NotFoundException('Payment plan not found');
    return plan;
  }

  async addMilestone(
    workspaceId: string,
    dealId: string,
    dto: CreateMilestoneDto,
  ): Promise<PaymentPlan> {
    await this.findDealOrFail(workspaceId, dealId);
    const plan = await this.paymentPlansRepository.findOne({
      where: { deal: { id: dealId } },
      relations: ['milestones'],
    });
    if (!plan)
      throw new NotFoundException('Payment plan not found. Create one first.');

    const milestone = this.paymentMilestonesRepository.create({
      paymentPlan: { id: plan.id } as any,
      name: dto.name,
      percentage: dto.percentage,
      amount: dto.amount,
      description: dto.description,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    });

    await this.paymentMilestonesRepository.save(milestone);

    plan.totalAmount = Number(plan.totalAmount) + Number(dto.amount);
    plan.milestones = undefined as any; // Prevent cascade from unlinking the new milestone
    return this.paymentPlansRepository.save(plan);
  }

  async updateMilestone(
    workspaceId: string,
    dealId: string,
    milestoneId: string,
    dto: UpdateMilestoneDto,
  ): Promise<PaymentMilestone> {
    await this.findDealOrFail(workspaceId, dealId);
    const milestone = await this.paymentMilestonesRepository.findOne({
      where: { id: milestoneId },
      relations: ['paymentPlan'],
    });
    if (!milestone || milestone.paymentPlan.dealId !== dealId)
      throw new NotFoundException('Milestone not found');

    Object.assign(milestone, {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : milestone.dueDate,
    });
    return this.paymentMilestonesRepository.save(milestone);
  }

  async deleteMilestone(
    workspaceId: string,
    dealId: string,
    milestoneId: string,
  ): Promise<void> {
    await this.findDealOrFail(workspaceId, dealId);
    const milestone = await this.paymentMilestonesRepository.findOne({
      where: { id: milestoneId },
      relations: ['paymentPlan'],
    });
    if (!milestone || milestone.paymentPlan.dealId !== dealId)
      throw new NotFoundException('Milestone not found');
    await this.paymentMilestonesRepository.remove(milestone);
  }

  // ─── BRIEF TEMPLATES ─────────────────────────────────────────────────────

  async createBriefTemplate(
    workspaceId: string,
    dto: CreateBriefTemplateDto,
  ): Promise<BriefTemplate> {
    const workspace = await this.workspacesRepository.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const currentTemplatesCount = await this.briefTemplatesRepository.count({
      where: { workspace: { id: workspaceId } },
    });

    const planLimits = {
      [WorkspacePlan.FREE]: 2,
      [WorkspacePlan.PRO]: 12,
      [WorkspacePlan.PREMIUM]: 30,
    };

    const limit = planLimits[workspace.plan] || planLimits[WorkspacePlan.FREE];

    if (currentTemplatesCount >= limit) {
      throw new BadRequestException(
        `Límite de plantillas alcanzado para el plan ${workspace.plan}. Máximo permitido: ${limit}`,
      );
    }

    const template = this.briefTemplatesRepository.create({
      ...dto,
      workspace: { id: workspaceId },
    });
    return await this.briefTemplatesRepository.save(template);
  }

  async findAllBriefTemplates(workspaceId: string): Promise<BriefTemplate[]> {
    return this.briefTemplatesRepository.find({
      where: { workspace: { id: workspaceId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneBriefTemplate(
    workspaceId: string,
    id: string,
  ): Promise<BriefTemplate> {
    const template = await this.briefTemplatesRepository.findOne({
      where: { id, workspace: { id: workspaceId } },
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async updateBriefTemplate(
    workspaceId: string,
    id: string,
    dto: Partial<CreateBriefTemplateDto>,
  ): Promise<BriefTemplate> {
    const template = await this.findOneBriefTemplate(workspaceId, id);
    Object.assign(template, dto);
    return await this.briefTemplatesRepository.save(template);
  }
}
