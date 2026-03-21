import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectBrief } from './entities/project-brief.entity';
import {
  ProjectCollaborator,
  ProjectRole,
} from './entities/project-collaborator.entity';
import { Workspace } from '../workspaces/workspace.entity';
import { ProjectStatus } from './enums/project-status.enum';
import { Deal } from '../deals/entities/deal.entity';
import { PaymentPlan } from '../deals/entities/payment-plan.entity';
import { PaymentMilestone } from '../deals/entities/payment-milestone.entity';
import { MilestoneSplit } from '../deals/entities/milestone-split.entity';
import { Brief } from '../deals/entities/brief.entity';
import { Quotation } from '../deals/entities/quotation.entity';
import { QuotationItem } from '../deals/entities/quotation-item.entity';
import { Client } from '../clients/client.entity';
import { BriefTemplate } from '../deals/entities/brief-template.entity';
import { PdfService } from '../core/pdf/pdf.service';
import { CreateMilestoneSplitDto } from '../deals/dto/milestone-split.dto';
import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
  CreatePaymentPlanDto,
} from '../deals/dto/payment-plan.dto';
import { ProjectsQueryDto } from './dto/projects-query.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  CreateProjectBriefDto,
  UpdateProjectBriefDto,
} from './dto/create-project-brief.dto';
import { paginate, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(ProjectBrief)
    private readonly projectBriefsRepository: Repository<ProjectBrief>,
    @InjectRepository(ProjectCollaborator)
    private readonly projectCollaboratorsRepository: Repository<ProjectCollaborator>,
    @InjectRepository(Workspace)
    private readonly workspacesRepository: Repository<Workspace>,
    @InjectRepository(Deal)
    private readonly dealsRepository: Repository<Deal>,
    @InjectRepository(PaymentPlan)
    private readonly paymentPlansRepository: Repository<PaymentPlan>,
    @InjectRepository(PaymentMilestone)
    private readonly paymentMilestonesRepository: Repository<PaymentMilestone>,
    @InjectRepository(MilestoneSplit)
    private readonly milestoneSplitsRepository: Repository<MilestoneSplit>,
    @InjectRepository(BriefTemplate)
    private readonly briefTemplatesRepository: Repository<BriefTemplate>,
    @InjectRepository(Brief)
    private readonly briefsRepository: Repository<Brief>,
    @InjectRepository(Quotation)
    private readonly quotationsRepository: Repository<Quotation>,
    @InjectRepository(QuotationItem)
    private readonly quotationItemsRepository: Repository<QuotationItem>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    private readonly pdfService: PdfService,
  ) {}

  async create(workspaceId: string, dto: CreateProjectDto): Promise<Project> {
    const project = this.projectsRepository.create({
      workspaceId,
      dealId: null,
      clientId: dto.clientId ?? null,
      name: dto.name,
      description: dto.description ?? null,
      currency: dto.currency ?? null,
      budget: dto.budget ?? null,
      status: ProjectStatus.ACTIVE,
    });
    return this.projectsRepository.save(project);
  }

  async update(
    workspaceId: string,
    projectId: string,
    dto: {
      name?: string;
      description?: string;
      status?: string;
      currency?: string;
      budget?: number | null;
    },
  ): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId, workspaceId },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (dto.name !== undefined) project.name = dto.name;
    if (dto.description !== undefined) project.description = dto.description ?? null;
    if (dto.status !== undefined) project.status = dto.status as ProjectStatus;
    if (dto.currency !== undefined) project.currency = dto.currency ?? null;
    if (dto.budget !== undefined) project.budget = dto.budget ?? null;
    if ((dto as Record<string, unknown>).clientUploadsEnabled !== undefined)
      project.clientUploadsEnabled = (dto as Record<string, unknown>).clientUploadsEnabled as boolean;
    return this.projectsRepository.save(project);
  }

  async createFromDeal(workspaceId: string, deal: Deal): Promise<Project> {
    const existing = await this.projectsRepository.findOne({
      where: { dealId: deal.id },
    });
    if (existing) return existing;

    const project = this.projectsRepository.create({
      workspaceId,
      name: deal.name,
      status: ProjectStatus.ACTIVE,
    });
    const saved = await this.projectsRepository.save(project);

    // Set deal_id via raw SQL. Using repository.save() or repository.update() fails
    // because TypeORM's expose-FK pattern (@Column dealId + @JoinColumn deal on the
    // same column) causes the FK to be ignored or reset during ORM processing.
    await this.projectsRepository.manager.query(
      `UPDATE "projects" SET "deal_id" = $1 WHERE "id" = $2`,
      [deal.id, saved.id],
    );

    saved.dealId = deal.id;
    saved.deal = deal;
    return saved;
  }

  async findAll(
    workspaceId: string,
    query: ProjectsQueryDto = new ProjectsQueryDto(),
  ): Promise<PaginatedResponse<Project>> {
    const { search, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const qb = this.projectsRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.deal', 'deal')
      .leftJoinAndSelect('deal.client', 'dealClient')
      .leftJoinAndSelect('project.client', 'directClient')
      .leftJoinAndSelect('project.collaborators', 'collaborators')
      .leftJoinAndSelect('collaborators.workspace', 'collaboratorWorkspace')
      .where(
        '(project.workspace_id = :workspaceId OR collaborators.workspace_id = :workspaceId)',
        { workspaceId },
      );

    if (search) {
      qb.andWhere('project.name ILIKE :search', { search: `%${search}%` });
    }
    if (status) {
      qb.andWhere('project.status = :status', { status });
    }

    const allowedSort = ['name', 'createdAt', 'status'];
    const orderField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
    qb.orderBy(`project.${orderField}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip(query.skip)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, query);
  }

  async findOne(workspaceId: string, projectId: string): Promise<object> {
    const project = await this.projectsRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.deal', 'deal')
      .leftJoinAndSelect('deal.client', 'dealClient')
      .leftJoinAndSelect('deal.brief', 'brief')
      .leftJoinAndSelect('brief.template', 'briefTemplate')
      .leftJoinAndSelect('deal.quotations', 'quotations')
      .leftJoinAndSelect('quotations.items', 'items')
      .leftJoinAndSelect('deal.paymentPlan', 'dealPaymentPlan')
      .leftJoinAndSelect('dealPaymentPlan.milestones', 'dealMilestones')
      .leftJoinAndSelect('dealMilestones.splits', 'dealSplits')
      .leftJoinAndSelect('dealSplits.collaboratorWorkspace', 'dealSplitWs')
      .leftJoinAndSelect('project.client', 'directClient')
      .leftJoinAndSelect('project.briefs', 'briefs')
      .leftJoinAndSelect('briefs.template', 'briefsTemplate')
      .leftJoinAndSelect('project.collaborators', 'collaborators')
      .leftJoinAndSelect('collaborators.workspace', 'collaboratorWorkspace')
      .where('project.id = :projectId', { projectId })
      .andWhere(
        '(project.workspace_id = :workspaceId OR collaborators.workspace_id = :workspaceId)',
        { workspaceId },
      )
      .getOne();

    if (!project) throw new NotFoundException('Project not found');

    let directPaymentPlan: PaymentPlan | null = null;
    if (!project.dealId) {
      directPaymentPlan = await this.paymentPlansRepository.findOne({
        where: { projectId: project.id },
        relations: [
          'milestones',
          'milestones.splits',
          'milestones.splits.collaboratorWorkspace',
        ],
      });
    }

    return { ...project, directPaymentPlan };
  }

  private async findProjectOwnerOrFail(
    workspaceId: string,
    projectId: string,
  ): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId, workspaceId },
      relations: ['collaborators'],
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async createProjectBrief(
    workspaceId: string,
    projectId: string,
    dto: CreateProjectBriefDto,
  ): Promise<ProjectBrief> {
    await this.findProjectOwnerOrFail(workspaceId, projectId);

    let templateSnapshot: {
      id: string;
      label: string;
      type: string;
      options?: string[];
      required?: boolean;
    }[] = [];

    if (dto.templateId) {
      const template = await this.briefTemplatesRepository.findOne({
        where: { id: dto.templateId, workspaceId },
      });
      if (!template) throw new NotFoundException('Brief template not found');
      templateSnapshot = template.schema ?? [];
    }

    const count = await this.projectBriefsRepository.count({
      where: { projectId },
    });

    const brief = this.projectBriefsRepository.create({
      projectId,
      name: dto.name,
      templateId: dto.templateId ?? null,
      templateSnapshot,
      responses: dto.responses ?? {},
      sortOrder: count,
    });
    return this.projectBriefsRepository.save(brief);
  }

  async updateProjectBrief(
    workspaceId: string,
    projectId: string,
    briefId: string,
    dto: UpdateProjectBriefDto,
  ): Promise<ProjectBrief> {
    await this.findProjectOwnerOrFail(workspaceId, projectId);
    const brief = await this.projectBriefsRepository.findOne({
      where: { id: briefId, projectId },
    });
    if (!brief) throw new NotFoundException('Project brief not found');
    if (dto.name !== undefined) brief.name = dto.name;
    if (dto.responses !== undefined) brief.responses = dto.responses;
    if (dto.isCompleted !== undefined) brief.isCompleted = dto.isCompleted;
    return this.projectBriefsRepository.save(brief);
  }

  async deleteProjectBrief(
    workspaceId: string,
    projectId: string,
    briefId: string,
  ): Promise<void> {
    await this.findProjectOwnerOrFail(workspaceId, projectId);
    const brief = await this.projectBriefsRepository.findOne({
      where: { id: briefId, projectId },
    });
    if (!brief) throw new NotFoundException('Project brief not found');
    await this.projectBriefsRepository.remove(brief);
  }

  async findProjectPaymentPlan(
    workspaceId: string,
    projectId: string,
  ): Promise<PaymentPlan> {
    await this.findProjectOwnerOrFail(workspaceId, projectId);
    const plan = await this.paymentPlansRepository.findOne({
      where: { projectId },
      relations: [
        'milestones',
        'milestones.splits',
        'milestones.splits.collaboratorWorkspace',
      ],
    });
    if (!plan) throw new NotFoundException('No payment plan for this project');
    return plan;
  }

  async createOrUpdateProjectPaymentPlan(
    workspaceId: string,
    projectId: string,
    dto: CreatePaymentPlanDto & { billingCycle?: string },
  ): Promise<PaymentPlan> {
    const project = await this.findProjectOwnerOrFail(workspaceId, projectId);
    if (project.dealId) {
      throw new BadRequestException(
        'Deal-based projects manage payment plan through the deal',
      );
    }

    const existing = await this.paymentPlansRepository.findOne({
      where: { projectId },
      relations: ['milestones', 'milestones.splits'],
    });
    if (existing) await this.paymentPlansRepository.remove(existing);

    const totalAmount = dto.milestones.reduce((s, m) => s + Number(m.amount), 0);
    const plan = this.paymentPlansRepository.create({
      projectId,
      dealId: null,
      totalAmount,
      billingCycle: (dto.billingCycle as PaymentPlan['billingCycle']) ?? null,
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

  async addProjectMilestone(
    workspaceId: string,
    projectId: string,
    dto: CreateMilestoneDto,
  ): Promise<PaymentPlan> {
    const project = await this.findProjectOwnerOrFail(workspaceId, projectId);
    if (project.dealId) {
      throw new BadRequestException(
        'Use the deal payment plan endpoint for deal-based projects',
      );
    }
    const plan = await this.paymentPlansRepository.findOne({
      where: { projectId },
      relations: ['milestones'],
    });
    if (!plan) throw new NotFoundException('Payment plan not found. Create one first.');

    await this.paymentMilestonesRepository.save(
      this.paymentMilestonesRepository.create({
        paymentPlan: { id: plan.id } as unknown as PaymentPlan,
        name: dto.name,
        percentage: dto.percentage,
        amount: dto.amount,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      }),
    );
    plan.totalAmount = Number(plan.totalAmount) + Number(dto.amount);
    plan.milestones = undefined as unknown as PaymentMilestone[];
    return this.paymentPlansRepository.save(plan);
  }

  async updateProjectMilestone(
    workspaceId: string,
    projectId: string,
    milestoneId: string,
    dto: UpdateMilestoneDto,
  ): Promise<PaymentMilestone> {
    await this.findProjectOwnerOrFail(workspaceId, projectId);
    const milestone = await this.paymentMilestonesRepository.findOne({
      where: { id: milestoneId },
      relations: ['paymentPlan'],
    });
    if (!milestone || milestone.paymentPlan.projectId !== projectId) {
      throw new NotFoundException('Milestone not found for this project');
    }
    if (dto.name) milestone.name = dto.name;
    if (dto.percentage !== undefined) milestone.percentage = dto.percentage;
    if (dto.amount !== undefined) milestone.amount = dto.amount;
    if (dto.description !== undefined) milestone.description = dto.description;
    if (dto.dueDate) milestone.dueDate = new Date(dto.dueDate);
    if (dto.status) (milestone as unknown as Record<string, unknown>)['status'] = dto.status;
    return this.paymentMilestonesRepository.save(milestone);
  }

  async deleteProjectMilestone(
    workspaceId: string,
    projectId: string,
    milestoneId: string,
  ): Promise<void> {
    await this.findProjectOwnerOrFail(workspaceId, projectId);
    const milestone = await this.paymentMilestonesRepository.findOne({
      where: { id: milestoneId },
      relations: ['paymentPlan'],
    });
    if (!milestone || milestone.paymentPlan.projectId !== projectId) {
      throw new NotFoundException('Milestone not found');
    }
    await this.paymentMilestonesRepository.remove(milestone);
  }

  async updateProjectPaymentSettings(
    workspaceId: string,
    projectId: string,
    dto: { billingCycle?: PaymentPlan['billingCycle'] },
  ): Promise<PaymentPlan> {
    const project = await this.findProjectOwnerOrFail(workspaceId, projectId);
    if (project.dealId) {
      throw new BadRequestException(
        'Deal-based projects manage payment settings through the deal',
      );
    }
    let plan = await this.paymentPlansRepository.findOne({ where: { projectId } });
    if (!plan) {
      plan = this.paymentPlansRepository.create({
        projectId,
        dealId: null,
        totalAmount: 0,
      });
    }
    if (dto.billingCycle !== undefined) plan.billingCycle = dto.billingCycle;
    return this.paymentPlansRepository.save(plan);
  }

  async addCollaborator(
    workspaceId: string,
    projectId: string,
    collaboratorWorkspaceId: string,
    role: ProjectRole = ProjectRole.VIEWER,
  ): Promise<ProjectCollaborator> {
    const project = await this.findProjectOwnerOrFail(workspaceId, projectId);
    const exists = await this.projectCollaboratorsRepository.findOne({
      where: {
        project: { id: project.id },
        workspace: { id: collaboratorWorkspaceId },
      },
    });
    if (exists) throw new BadRequestException('This workspace is already a collaborator');
    const collaborator = this.projectCollaboratorsRepository.create({
      project: { id: project.id },
      workspace: { id: collaboratorWorkspaceId },
      role,
    });
    return this.projectCollaboratorsRepository.save(collaborator);
  }

  async removeCollaborator(
    workspaceId: string,
    projectId: string,
    collaboratorId: string,
  ): Promise<void> {
    const project = await this.findProjectOwnerOrFail(workspaceId, projectId);
    const collaborator = await this.projectCollaboratorsRepository.findOne({
      where: { id: collaboratorId, project: { id: project.id } },
    });
    if (!collaborator) throw new NotFoundException('Collaborator not found');
    await this.projectCollaboratorsRepository.remove(collaborator);
  }

  async addMilestoneSplit(
    workspaceId: string,
    projectId: string,
    milestoneId: string,
    dto: CreateMilestoneSplitDto,
  ): Promise<MilestoneSplit> {
    const project = await this.findProjectOwnerOrFail(workspaceId, projectId);
    const milestone = await this.paymentMilestonesRepository.findOne({
      where: { id: milestoneId },
      relations: ['paymentPlan', 'paymentPlan.deal', 'splits'],
    });
    if (!milestone || milestone.paymentPlan.deal?.id !== project.dealId) {
      throw new NotFoundException('Milestone not found for this project');
    }
    const currentTotal = milestone.splits.reduce((acc, s) => acc + Number(s.amount), 0);
    if (currentTotal + dto.amount > milestone.amount) {
      throw new BadRequestException('Split amounts exceed total milestone amount');
    }
    const split = this.milestoneSplitsRepository.create({
      milestoneId: milestone.id,
      collaboratorWorkspaceId: dto.collaboratorWorkspaceId,
      percentage: dto.percentage,
      amount: dto.amount,
    });
    return this.milestoneSplitsRepository.save(split);
  }

  async deleteMilestoneSplit(
    workspaceId: string,
    projectId: string,
    milestoneId: string,
    splitId: string,
  ): Promise<void> {
    const project = await this.findProjectOwnerOrFail(workspaceId, projectId);
    const split = await this.milestoneSplitsRepository.findOne({
      where: { id: splitId, milestoneId },
      relations: [
        'paymentMilestone',
        'paymentMilestone.paymentPlan',
        'paymentMilestone.paymentPlan.deal',
      ],
    });
    if (!split || split.paymentMilestone.paymentPlan.deal?.id !== project.dealId) {
      throw new NotFoundException('Milestone Split not found');
    }
    await this.milestoneSplitsRepository.remove(split);
  }

  // ─── PDF re-enqueue ────────────────────────────────────────────────────────

  async enqueueDealPdfs(workspaceId: string, projectId: string): Promise<{ queued: boolean; pendingBriefs: number }> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId, workspaceId },
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    if (!project.dealId) throw new BadRequestException('Este proyecto no tiene un deal asociado');

    // Workspace drive tokens
    const workspace = await this.workspacesRepository
      .createQueryBuilder('w')
      .addSelect('w.googleDriveAccessToken')
      .addSelect('w.googleDriveRefreshToken')
      .where('w.id = :id', { id: workspaceId })
      .getOne();

    if (!workspace?.googleDriveAccessToken || !workspace?.googleDriveRefreshToken) {
      throw new BadRequestException('Google Drive no está conectado en este workspace');
    }

    // ─── Determine what still needs to be generated ──────────────────────────
    const gen = project.generatedDocuments ?? { quotationGenerated: false, generatedBriefIds: [] };

    // Quotation: only include if not yet generated
    const includeQuotation = !gen.quotationGenerated;

    // Project briefs not yet generated
    const allProjectBriefs = await this.projectBriefsRepository.find({
      where: { projectId },
      order: { sortOrder: 'ASC' },
    });
    const pendingProjectBriefs = allProjectBriefs.filter(
      (b) => !gen.generatedBriefIds.includes(b.id),
    );

    if (!includeQuotation && pendingProjectBriefs.length === 0) {
      return { queued: false, pendingBriefs: 0 };
    }

    // ─── Load data only for what's needed ────────────────────────────────────
    const deal = await this.dealsRepository.findOne({
      where: { id: project.dealId, workspaceId },
      relations: ['quotations'],
    });
    if (!deal) throw new NotFoundException('Deal no encontrado');

    let quotationPayload: any = null;
    if (includeQuotation) {
      const approvedQuotation = deal.quotations?.find((q) => q.isApproved) ?? null;
      const quotationWithItems = approvedQuotation
        ? await this.quotationsRepository.findOne({
            where: { id: approvedQuotation.id },
            relations: ['items'],
          })
        : null;

      if (quotationWithItems) {
        quotationPayload = {
          optionName: quotationWithItems.optionName ?? undefined,
          total: quotationWithItems.total ?? 0,
          currency: deal.currency?.code ?? 'USD',
          currencySymbol: deal.currency?.symbol ?? '$',
          terms: deal.proposalTerms ?? undefined,
          items: (quotationWithItems.items ?? []).map((item) => ({
            name: item.name,
            description: item.description ?? undefined,
            quantity: item.quantity ?? 1,
            unitPrice: Number(item.price) ?? 0,
            total: (Number(item.price) * (item.quantity ?? 1)) - Number(item.discount ?? 0),
          })),
        };
      }
    }

    const clientId = deal.clientId;
    const client = clientId
      ? await this.clientsRepository.findOne({ where: { id: clientId } })
      : null;

    await this.pdfService.enqueueDealWon({
      type: 'deal_won',
      projectId: project.id,
      projectName: project.name,
      dealName: deal.name,
      clientName: client?.name,
      driveFolderId: project.driveFolderId ?? null,
      driveRootFolderId: workspace.googleDriveRootFolderId ?? null,
      accessToken: workspace.googleDriveAccessToken,
      refreshToken: workspace.googleDriveRefreshToken,
      quotation: quotationPayload,
      briefs: pendingProjectBriefs.map((b) => ({
        name: b.name,
        schema: (b.templateSnapshot as any[]) ?? [],
        responses: (b.responses as Record<string, unknown>) ?? {},
      })),
    });

    // ─── Update tracking ─────────────────────────────────────────────────────
    await this.projectsRepository.update(projectId, {
      generatedDocuments: {
        quotationGenerated: true,
        generatedBriefIds: [
          ...gen.generatedBriefIds,
          ...pendingProjectBriefs.map((b) => b.id),
        ],
      },
    });

    return { queued: true, pendingBriefs: pendingProjectBriefs.length };
  }
}
