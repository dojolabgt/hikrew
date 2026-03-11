import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { ProjectRole } from './entities/project-collaborator.entity';
import { CreateMilestoneSplitDto } from '../deals/dto/milestone-split.dto';

@Controller('workspaces/:workspaceId/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.projectsService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.projectsService.findOne(workspaceId, id);
  }

  // ─── COLLABORATORS ───────────────────────────────────────────────────────

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
    return this.projectsService.removeCollaborator(
      workspaceId,
      projectId,
      collaboratorId,
    );
  }

  // ─── MILESTONE SPLITS ───────────────────────────────────────────────────

  @Post(':id/milestones/:milestoneId/splits')
  addMilestoneSplit(
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: CreateMilestoneSplitDto,
  ) {
    return this.projectsService.addMilestoneSplit(
      workspaceId,
      projectId,
      milestoneId,
      dto,
    );
  }

  @Delete(':id/milestones/:milestoneId/splits/:splitId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMilestoneSplit(
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @Param('splitId') splitId: string,
  ) {
    return this.projectsService.deleteMilestoneSplit(
      workspaceId,
      projectId,
      milestoneId,
      splitId,
    );
  }
}
