import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { ClientsQueryDto } from './dto/clients-query.dto';
import { AcceptInviteDto } from './dto/invite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthRequest } from '../common/types/auth-request';

// ─── Authenticated (workspace-scoped) endpoints ───────────────────────────────

@Controller('clients')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateClientDto) {
    return this.clientsService.create(req.workspaceId, dto);
  }

  @Get()
  findAll(@Req() req: AuthRequest, @Query() query: ClientsQueryDto) {
    return this.clientsService.findAll(req.workspaceId, query);
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.clientsService.findOne(req.workspaceId, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(req.workspaceId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.clientsService.remove(req.workspaceId, id);
  }

  /** POST /clients/:id/invite — generate magic link + send email */
  @Post(':id/invite')
  inviteToPortal(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.clientsService.inviteToPortal(req.workspaceId, id);
  }
}

// ─── Public invite endpoints (no auth required) ───────────────────────────────

@Public()
@Controller('clients/invite')
export class PublicClientInviteController {
  constructor(private readonly clientsService: ClientsService) {}

  /** GET /clients/invite/:token */
  @Get(':token')
  getInviteDetails(@Param('token') token: string) {
    return this.clientsService.getInviteDetails(token);
  }

  /** POST /clients/invite/:token/accept — for new users (password required) */
  @Post(':token/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  acceptInvite(
    @Param('token') token: string,
    @Body() dto: AcceptInviteDto,
  ): Promise<void> {
    return this.clientsService.acceptInvite(token, dto.password);
  }
}

// ─── Authenticated invite acceptance (JWT required, no password needed) ───────

@Controller('clients/invite')
@UseGuards(JwtAuthGuard)
export class AuthenticatedClientInviteController {
  constructor(private readonly clientsService: ClientsService) {}

  /** POST /clients/invite/:token/accept-authenticated */
  @Post(':token/accept-authenticated')
  @HttpCode(HttpStatus.NO_CONTENT)
  acceptInviteAuthenticated(
    @Param('token') token: string,
    @Req() req: AuthRequest,
  ): Promise<void> {
    return this.clientsService.acceptInviteForUser(token, req.user.id);
  }
}
