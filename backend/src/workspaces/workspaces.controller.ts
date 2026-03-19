import {
  Controller,
  Get,
  Req,
  UseGuards,
  Patch,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import type { UpdateRecurrenteKeysDto } from './workspaces.service';
import type { AuthRequest } from '../common/types/auth-request';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get('my-workspaces')
  async getMyWorkspaces(@Req() req: AuthRequest) {
    return this.workspacesService.findByUserId(req.user.id);
  }

  /**
   * Creates a new workspace for an already-authenticated user.
   * Used when a client user wants to also operate as a freelancer/owner.
   */
  @Post('create')
  async createWorkspace(@Req() req: AuthRequest) {
    const existing = await this.workspacesService.findByUserId(req.user.id);
    const alreadyOwner = existing.some(
      (m) => m.role === 'owner' || m.role === 'collaborator',
    );
    if (alreadyOwner) {
      // Return the existing workspace instead of creating a duplicate
      const ownerMembership = existing.find(
        (m) => m.role === 'owner' || m.role === 'collaborator',
      );
      return ownerMembership!.workspace;
    }
    return this.workspacesService.createDefaultWorkspace(req.user.id);
  }

  @Patch('current')
  @UseGuards(WorkspaceGuard)
  async updateWorkspace(
    @Req() req: AuthRequest,
    @Body() data: UpdateWorkspaceDto,
  ) {
    // Note: Request.workspaceId is set by the WorkspaceGuard!
    return this.workspacesService.updateWorkspace(req.workspaceId, data);
  }

  @Post('current/logo')
  @UseGuards(WorkspaceGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @Req() req: AuthRequest,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.workspacesService.uploadLogo(req.workspaceId, file);
  }

  @Get('current/recurrente/status')
  @UseGuards(WorkspaceGuard)
  async getRecurrenteStatus(@Req() req: AuthRequest) {
    return this.workspacesService.getRecurrenteStatus(req.workspaceId);
  }

  @Post('current/recurrente')
  @UseGuards(WorkspaceGuard)
  async updateRecurrenteKeys(
    @Req() req: AuthRequest,
    @Body() body: UpdateRecurrenteKeysDto,
  ) {
    return this.workspacesService.updateRecurrenteKeys(req.workspaceId, body);
  }
}
