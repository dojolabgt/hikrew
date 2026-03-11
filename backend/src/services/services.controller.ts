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
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import type { AuthRequest } from '../common/types/auth-request';

@Controller('services')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(req.workspaceId, dto);
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.servicesService.findAll(req.workspaceId);
  }

  // Allow fetching any workspace's services (needed by collaborators in a deal)
  @Get('workspace/:workspaceId')
  findAllByWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.servicesService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.servicesService.findOne(req.workspaceId, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(req.workspaceId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.servicesService.remove(req.workspaceId, id);
  }
}
