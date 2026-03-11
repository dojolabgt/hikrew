import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { WorkspaceTaxesService } from './workspace-taxes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import type { AuthRequest } from '../common/types/auth-request';

@Controller('workspaces')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class WorkspaceTaxesController {
  constructor(private readonly taxesService: WorkspaceTaxesService) {}

  /** Lista todos los impuestos del workspace activo */
  @Get('current/taxes')
  findAll(@Req() req: AuthRequest) {
    return this.taxesService.findAll(req.workspaceId);
  }

  /** Crea un impuesto custom */
  @Post('current/taxes')
  create(@Req() req: AuthRequest, @Body() dto: CreateTaxDto) {
    return this.taxesService.create(req.workspaceId, dto);
  }

  /**
   * Seed de impuestos desde pais.json.
   * Recibe el array `taxes` del país seleccionado. Es idempotente:
   * si el workspace ya tiene taxes no hace nada.
   */
  @Post('current/taxes/seed')
  seed(
    @Req() req: AuthRequest,
    @Body()
    body: {
      taxes: Array<{
        key: string;
        label: string;
        rate: number;
        appliesTo?: 'all' | 'services' | 'products';
        description?: string;
        isDefault?: boolean;
      }>;
    },
  ) {
    return this.taxesService.seedFromCountry(req.workspaceId, body.taxes);
  }

  /** Actualiza un impuesto existente */
  @Patch('current/taxes/:id')
  update(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaxDto,
  ) {
    return this.taxesService.update(req.workspaceId, id, dto);
  }

  /** Elimina un impuesto */
  @Delete('current/taxes/:id')
  remove(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.taxesService.remove(req.workspaceId, id);
  }
}
