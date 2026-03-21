import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { GoogleDriveService } from './google-drive.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { Public } from '../auth/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import type { AuthRequest } from '../common/types/auth-request';

// ─── Workspace-level Drive management ────────────────────────────────────────

@Controller('workspaces/current/google-drive')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class WorkspaceDriveController {
  constructor(
    private readonly driveService: GoogleDriveService,
    private readonly config: ConfigService,
  ) {}

  /** GET /workspaces/current/google-drive/status */
  @Get('status')
  getStatus(@Req() req: AuthRequest) {
    return this.driveService.getStatus(req.workspaceId);
  }

  /** GET /workspaces/current/google-drive/auth-url */
  @Get('auth-url')
  getAuthUrl(@Req() req: AuthRequest) {
    const url = this.driveService.getAuthUrl(req.workspaceId);
    return { url };
  }

  /** POST /workspaces/current/google-drive/setup-folder */
  @Post('setup-folder')
  setupFolder(
    @Req() req: AuthRequest,
    @Body('folderName') folderName: string,
  ) {
    if (!folderName?.trim()) throw new BadRequestException('folderName is required');
    return this.driveService.setupWorkspaceFolder(req.workspaceId, folderName);
  }

  /** GET /workspaces/current/google-drive/files?folderId=xxx */
  @Get('files')
  getWorkspaceFiles(
    @Req() req: AuthRequest,
    @Query('folderId') folderId?: string,
  ) {
    return this.driveService.getWorkspaceFiles(req.workspaceId, folderId);
  }

  /** POST /workspaces/current/google-drive/upload */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadWorkspaceFile(
    @Req() req: AuthRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    return this.driveService.uploadWorkspaceFile(req.workspaceId, file);
  }

  /** DELETE /workspaces/current/google-drive/files/:fileId */
  @Delete('files/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteWorkspaceFile(
    @Req() req: AuthRequest,
    @Param('fileId') fileId: string,
  ): Promise<void> {
    return this.driveService.deleteWorkspaceFile(req.workspaceId, fileId);
  }

  /** DELETE /workspaces/current/google-drive */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  disconnect(@Req() req: AuthRequest): Promise<void> {
    return this.driveService.disconnect(req.workspaceId);
  }
}

// ─── OAuth callback (called by Google — must be public) ───────────────────────

@Public()
@Controller('workspaces/google-drive')
export class GoogleDriveCallbackController {
  constructor(
    private readonly driveService: GoogleDriveService,
    private readonly config: ConfigService,
  ) {}

  /** GET /workspaces/google-drive/callback?code=...&state=workspaceId */
  @Get('callback')
  async oauthCallback(
    @Query('code') code: string,
    @Query('state') workspaceId: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.config.get<string>(
      'NEXT_PUBLIC_DASHBOARD_URL',
      'http://localhost:3000',
    );

    if (error || !code || !workspaceId) {
      return res.redirect(`${frontendUrl}/dashboard/settings/integrations?drive=error`);
    }

    try {
      await this.driveService.handleOAuthCallback(code, workspaceId);
      return res.redirect(`${frontendUrl}/dashboard/settings/integrations?drive=connected`);
    } catch (err) {
      return res.redirect(`${frontendUrl}/dashboard/settings/integrations?drive=error`);
    }
  }
}

// ─── Project-level Drive operations ──────────────────────────────────────────

@Controller('projects/:projectId/drive')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class ProjectDriveController {
  constructor(private readonly driveService: GoogleDriveService) {}

  /** POST /projects/:projectId/drive/folder — create (or get existing) project folder */
  @Post('folder')
  createFolder(@Req() req: AuthRequest, @Param('projectId') projectId: string) {
    return this.driveService.createProjectFolder(req.workspaceId, projectId);
  }

  /** GET /projects/:projectId/drive/files */
  @Get('files')
  getFiles(@Req() req: AuthRequest, @Param('projectId') projectId: string) {
    return this.driveService.getFiles(req.workspaceId, projectId);
  }

  /** POST /projects/:projectId/drive/upload */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Req() req: AuthRequest,
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    return this.driveService.uploadFile(req.workspaceId, projectId, file);
  }

  /** DELETE /projects/:projectId/drive/files/:fileId */
  @Delete('files/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFile(
    @Req() req: AuthRequest,
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
  ): Promise<void> {
    return this.driveService.deleteFile(req.workspaceId, projectId, fileId);
  }
}
