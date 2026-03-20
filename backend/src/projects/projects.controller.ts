import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { ProjectRole } from './entities/project-collaborator.entity';
import { CreateMilestoneSplitDto } from '../deals/dto/milestone-split.dto';
import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
  CreatePaymentPlanDto,
} from '../deals/dto/payment-plan.dto';
import { ProjectsQueryDto } from './dto/projects-query.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateProjectBriefDto, UpdateProjectBriefDto } from './dto/create-project-brief.dto';

@Controller('workspaces/:workspaceId/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(workspaceId, dto);
  }

  @Get()
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Query() query: ProjectsQueryDto,
  ) {
    return this.projectsService.findAll(workspaceId, query);
  }

  @Get(':id')
  findOne(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.projectsService.findOne(workspaceId, id);
  }

  @Patch(':id')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: { name?: string; description?: string; status?: string; currency?: string; budget?: number | null },
  ) {
    return this.projectsService.update(workspaceId, id, dto);
  }

  // ─── PROJECT BRIEFS ─────────────────────────────────────────────────────

  @Post(':id/briefs')
  createBrief(
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
    @Body() dto: CreateProjectBriefDto,
  ) {
    return this.projectsService.createProjectBrief(workspaceId, projectId, dto);
  }

  @Patch(':id/briefs/:briefId')
  updateBrief(
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
    @Param('briefId') briefId: string,
    @Body() dto: UpdateProjectBriefDto,
  ) {
    return this.projectsService.updateProjectBrief(workspaceId, projectId, briefId, dto);
  }

  @Delete(':id/briefs/:briefId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteBrief(
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
    @Param('briefId') briefId: string,
  ) {
    return this.projectsService.deleteProjectBrief(workspaceId, projectId, briefId);
  }

  // ─── PROJECT-LEVEL PAYMENT PLAN ─────────────────────────────────────────

  @Get(':id/payment-plan')
  getPaymentPlan(
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
  ) {
    return this.projectsService.findProjectPaymentPlan(workspaceId, projectId);
  }

  @Post(':id/payment-plan')
  createOrUpdatePaymentPlan(
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
    @Body() dto: CreatePaymentPlanDto & { billingCycle?: string },
  ) {
    return this.projectsService.createOrUpdateProjectPaymentPlan(workspaceId, projectId, dto);
  }

  @Patch(':id/payment-plan/settings')
  updatePaymentSettings(
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
    @Body() dto: { billingCycle?: 'one_time' | 'monthly' | 'quarterly' | 'annual' },
  ) {
    return this.projectsService.updateProjectPaymentSettings(workspaceId, projectId, dto);
  }

  @Post(':id/payment-plan/milestones')
  addMilestone(
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    return this.projectsService.addProjectMilestone(workspaceId, projectId, dto);
  }

  @Patch(':id/payment-plan/milestones/:milestoneId')
  updateMilestone(
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return this.projectsService.updateProjectMilestone(workspaceId, projectId, milestoneId, dto);
  }

  @Delete(':id/payment-plan/milestones/:milestoneId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMilestone(
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.projectsService.deleteProjectMilestone(workspaceId, projectId, milestoneId);
  }

  // ─── COLLABORATORS ──────────────────────────────────────────────────────

  @Post(':id/collaborators')
  addCollaborator(
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
    @Body() body: { collaboratorWorkspaceId: string; role?: ProjectRole },
  ) {
    return this.projectsService.addCollaborator(
      workspaceId,
      projectId,
      body.collaboratorWorkspaceId,
      body.role,
    );
  }

  @Delete(':id/collaborators/:collaboratorId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCollaborator(
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
    @Param('collaboratorId') collaboratorId: string,
  ) {
    return this.projectsService.removeCollaborator(workspaceId, projectId, collaboratorId);
  }

  // ─── MILESTONE SPLITS (deal-based) ──────────────────────────────────────

  @Post(':id/milestones/:milestoneId/splits')
  addMilestoneSplit(
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: CreateMilestoneSplitDto,
  ) {
    return this.projectsService.addMilestoneSplit(workspaceId, projectId, milestoneId, dto);
  }

  @Delete(':id/milestones/:milestoneId/splits/:splitId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMilestoneSplit(
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @Param('splitId') splitId: string,
  ) {
    return this.projectsService.deleteMilestoneSplit(workspaceId, projectId, milestoneId, splitId);
  }
}
