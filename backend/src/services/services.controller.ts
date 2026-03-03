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

@Controller('services')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(req.workspaceId, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.servicesService.findAll(req.workspaceId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.servicesService.findOne(req.workspaceId, id);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(req.workspaceId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.servicesService.remove(req.workspaceId, id);
  }
}
