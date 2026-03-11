import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/constants/roles';
import { BillingService } from '../billing/billing.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly billingService: BillingService) {}

  @Post('workspaces/:workspaceId/upgrade')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async upgradeWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: { plan: 'pro' | 'premium' },
  ) {
    return this.billingService.devOverridePlan(workspaceId, dto.plan);
  }
}
