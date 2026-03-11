import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import {
  ProjectCollaborator,
  ProjectRole,
} from './entities/project-collaborator.entity';
import { Workspace } from '../workspaces/workspace.entity';
import { ProjectStatus } from './enums/project-status.enum';
import { Deal } from '../deals/entities/deal.entity';
import { PaymentMilestone } from '../deals/entities/payment-milestone.entity';
import { MilestoneSplit } from '../deals/entities/milestone-split.entity';
import { CreateMilestoneSplitDto } from '../deals/dto/milestone-split.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(ProjectCollaborator)
    private readonly projectCollaboratorsRepository: Repository<ProjectCollaborator>,
    @InjectRepository(Workspace)
    private readonly workspacesRepository: Repository<Workspace>,
    @InjectRepository(PaymentMilestone)
    private readonly paymentMilestonesRepository: Repository<PaymentMilestone>,
    @InjectRepository(MilestoneSplit)
    private readonly milestoneSplitsRepository: Repository<MilestoneSplit>,
  ) {}

  async createFromDeal(workspaceId: string, deal: Deal): Promise<Project> {
    // Check if project already exists for this deal to be idempotent
    const existingProject = await this.projectsRepository.findOne({
      where: { dealId: deal.id },
    });

    if (existingProject) {
      return existingProject;
    }

    const project = this.projectsRepository.create({
      workspaceId,
      dealId: deal.id,
      name: deal.name,
      status: ProjectStatus.ACTIVE,
    });

    return await this.projectsRepository.save(project);
  }

  async findAll(workspaceId: string): Promise<Project[]> {
    return this.projectsRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.deal', 'deal')
      .leftJoinAndSelect('deal.client', 'client')
      .leftJoinAndSelect('project.collaborators', 'collaborators')
      .leftJoinAndSelect('collaborators.workspace', 'collaboratorWorkspace')
      .where('project.workspace_id = :workspaceId', { workspaceId })
      .orWhere('collaborators.workspace_id = :workspaceId', { workspaceId })
      .orderBy('project.createdAt', 'DESC')
      .getMany();
  }

  async findOne(workspaceId: string, projectId: string): Promise<Project> {
    const project = await this.projectsRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.deal', 'deal')
      .leftJoinAndSelect('deal.client', 'client')
      .leftJoinAndSelect('deal.brief', 'brief')
      .leftJoinAndSelect('brief.template', 'briefTemplate')
      .leftJoinAndSelect('deal.quotations', 'quotations')
      .leftJoinAndSelect('quotations.items', 'items')
      .leftJoinAndSelect('deal.paymentPlan', 'paymentPlan')
      .leftJoinAndSelect('paymentPlan.milestones', 'milestones')
      .leftJoinAndSelect('milestones.splits', 'splits')
      .leftJoinAndSelect('splits.collaboratorWorkspace', 'splitWorkspace')
      .leftJoinAndSelect('project.collaborators', 'collaborators')
      .leftJoinAndSelect('collaborators.workspace', 'collaboratorWorkspace')
      .where('project.id = :projectId', { projectId })
      .andWhere(
        '(project.workspace_id = :workspaceId OR collaborators.workspace_id = :workspaceId)',
        { workspaceId },
      )
      .getOne();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  // ─── COLLABORATORS ───────────────────────────────────────────────────────

  private async findProjectOrFail(
    workspaceId: string,
    projectId: string,
    requireEditor: boolean = false,
  ): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: [{ id: projectId, workspaceId: workspaceId }],
      relations: ['workspace', 'collaborators'],
    });

    if (!project) throw new NotFoundException('Project not found');

    if (requireEditor && project.workspace.id !== workspaceId) {
      const col = project.collaborators?.find(
        (c) => c.workspaceId === workspaceId,
      );
      if (!col || col.role !== ProjectRole.EDITOR) {
        throw new BadRequestException(
          'No tienes permisos de Editor para modificar este Project',
        );
      }
    }

    return project;
  }

  async addCollaborator(
    workspaceId: string,
    projectId: string,
    collaboratorWorkspaceId: string,
    role: ProjectRole = ProjectRole.VIEWER,
  ): Promise<ProjectCollaborator> {
    const project = await this.findProjectOrFail(workspaceId, projectId, true);

    const exists = await this.projectCollaboratorsRepository.findOne({
      where: {
        project: { id: project.id },
        workspace: { id: collaboratorWorkspaceId },
      },
    });

    if (exists) {
      throw new BadRequestException(
        'This workspace is already a collaborator on this project',
      );
    }

    const collaborator = this.projectCollaboratorsRepository.create({
      project: { id: project.id },
      workspace: { id: collaboratorWorkspaceId },
      role,
    });

    return await this.projectCollaboratorsRepository.save(collaborator);
  }

  async removeCollaborator(
    workspaceId: string,
    projectId: string,
    collaboratorId: string,
  ): Promise<void> {
    const project = await this.findProjectOrFail(workspaceId, projectId, true);
    const collaborator = await this.projectCollaboratorsRepository.findOne({
      where: { id: collaboratorId, project: { id: project.id } },
    });

    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    await this.projectCollaboratorsRepository.remove(collaborator);
  }

  // ─── MILESTONE SPLITS ────────────────────────────────────────────────────

  async addMilestoneSplit(
    workspaceId: string,
    projectId: string,
    milestoneId: string,
    dto: CreateMilestoneSplitDto,
  ): Promise<MilestoneSplit> {
    const project = await this.findProjectOrFail(workspaceId, projectId, true);
    const milestone = await this.paymentMilestonesRepository.findOne({
      where: { id: milestoneId },
      relations: ['paymentPlan', 'paymentPlan.deal', 'splits'],
    });

    if (!milestone || milestone.paymentPlan.deal.id !== project.dealId) {
      throw new NotFoundException('Milestone not found for this project');
    }

    const currentSplitsAmount = milestone.splits.reduce(
      (acc, split) => acc + Number(split.amount),
      0,
    );
    if (currentSplitsAmount + dto.amount > milestone.amount) {
      throw new BadRequestException(
        'Split amounts exceed total milestone amount',
      );
    }

    const split = this.milestoneSplitsRepository.create({
      milestoneId: milestone.id,
      collaboratorWorkspaceId: dto.collaboratorWorkspaceId,
      percentage: dto.percentage,
      amount: dto.amount,
    });

    return await this.milestoneSplitsRepository.save(split);
  }

  async deleteMilestoneSplit(
    workspaceId: string,
    projectId: string,
    milestoneId: string,
    splitId: string,
  ): Promise<void> {
    const project = await this.findProjectOrFail(workspaceId, projectId, true);
    const split = await this.milestoneSplitsRepository.findOne({
      where: { id: splitId, milestoneId: milestoneId },
      relations: [
        'paymentMilestone',
        'paymentMilestone.paymentPlan',
        'paymentMilestone.paymentPlan.deal',
      ],
    });

    if (
      !split ||
      split.paymentMilestone.paymentPlan.deal.id !== project.dealId
    ) {
      throw new NotFoundException('Milestone Split not found');
    }

    await this.milestoneSplitsRepository.remove(split);
  }
}
