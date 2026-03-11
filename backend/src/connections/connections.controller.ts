import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { InviteConnectionDto } from './dto/invite-connection.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post('invite')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  async inviteConnection(
    @Req() req: RequestWithUser & { workspaceId: string },
    @Body() dto: InviteConnectionDto,
  ) {
    return this.connectionsService.inviteConnection(req.workspaceId, dto);
  }

  @Post('link')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  async generateConnectionLink(
    @Req() req: RequestWithUser & { workspaceId: string },
  ) {
    return this.connectionsService.generateConnectionLink(req.workspaceId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  async getConnections(@Req() req: RequestWithUser & { workspaceId: string }) {
    return this.connectionsService.testGetPendingInvitesAndConnections(
      req.workspaceId,
    );
  }

  @Get('pending/received')
  @UseGuards(JwtAuthGuard)
  async getReceivedInvites(@Req() req: RequestWithUser) {
    // This looks up invites by the user's email globally
    return this.connectionsService.getPendingRequestsForEmail(req.user.email);
  }

  @Get('public/:token')
  async getPublicInvite(@Param('token') token: string) {
    return this.connectionsService.getPublicInviteInfo(token);
  }

  @Post('public/:token/accept')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @HttpCode(200)
  async acceptInvite(
    @Req() req: RequestWithUser & { workspaceId: string },
    @Param('token') token: string,
  ) {
    // The user accepts it into their active workspace (req.workspaceId)
    // They must own or be admin of that workspace, though WorkspaceGuard allows any member for now.
    // In a strict implementation, we'd check req.workspaceRole === 'owner'.

    return this.connectionsService.acceptConnection(
      token,
      req.workspaceId,
      req.user.email,
    );
  }

  @Post('public/:token/reject')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async rejectInvite(
    @Req() req: RequestWithUser,
    @Param('token') token: string,
  ) {
    return this.connectionsService.rejectConnection(token, req.user.email);
  }
}
