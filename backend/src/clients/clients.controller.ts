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
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import type { AuthRequest } from '../common/types/auth-request';

@Controller('clients')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateClientDto) {
    return this.clientsService.create(req.workspaceId, dto);
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.clientsService.findAll(req.workspaceId);
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
}
