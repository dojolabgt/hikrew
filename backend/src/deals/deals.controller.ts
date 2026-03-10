import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { CreateBriefTemplateDto } from './dto/create-brief-template.dto';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { AddQuotationItemDto } from './dto/add-quotation-item.dto';
import { UpdateQuotationItemDto } from './dto/update-quotation-item.dto';
import {
  CreatePaymentPlanDto,
  UpdateMilestoneDto,
  CreateMilestoneDto,
} from './dto/payment-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('workspaces/:workspaceId/deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  // ─── DEALS ───────────────────────────────────────────────────────────────

  @Post()
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() createDealDto: CreateDealDto,
  ) {
    return this.dealsService.create(workspaceId, createDealDto);
  }

  @Get()
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.dealsService.findAll(workspaceId);
  }

  // ─── BRIEF TEMPLATES (must be above /:id routes) ─────────────────────────

  @Post('brief-templates')
  createBriefTemplate(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateBriefTemplateDto,
  ) {
    return this.dealsService.createBriefTemplate(workspaceId, dto);
  }

  @Get('brief-templates')
  findAllBriefTemplates(@Param('workspaceId') workspaceId: string) {
    return this.dealsService.findAllBriefTemplates(workspaceId);
  }

  @Get('brief-templates/:id')
  findOneBriefTemplate(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.dealsService.findOneBriefTemplate(workspaceId, id);
  }

  @Patch('brief-templates/:id') // Fixed: was @Post
  updateBriefTemplate(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateBriefTemplateDto>,
  ) {
    return this.dealsService.updateBriefTemplate(workspaceId, id, dto);
  }

  // ─── DEAL BY ID ───────────────────────────────────────────────────────────

  @Get(':id')
  findOne(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.dealsService.findOne(workspaceId, id);
  }

  @Patch(':id')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() updateDealDto: UpdateDealDto,
  ) {
    return this.dealsService.update(workspaceId, id, updateDealDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteDeal(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.dealsService.deleteDeal(workspaceId, id);
  }

  // ─── QUOTATIONS ───────────────────────────────────────────────────────────

  @Post(':id/quotations')
  createQuotation(
    @Param('workspaceId') workspaceId: string,
    @Param('id') dealId: string,
    @Body() dto: CreateQuotationDto,
  ) {
    return this.dealsService.createQuotation(workspaceId, dealId, dto);
  }

  @Get(':id/quotations')
  findAllQuotations(
    @Param('workspaceId') workspaceId: string,
    @Param('id') dealId: string,
  ) {
    return this.dealsService.findAllQuotations(workspaceId, dealId);
  }

  @Patch(':id/quotations/:quotationId')
  updateQuotation(
    @Param('workspaceId') workspaceId: string,
    @Param('id') dealId: string,
    @Param('quotationId') quotationId: string,
    @Body() dto: UpdateQuotationDto,
  ) {
    return this.dealsService.updateQuotation(
      workspaceId,
      dealId,
      quotationId,
      dto,
    );
  }

  @Delete(':id/quotations/:quotationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteQuotation(
    @Param('workspaceId') workspaceId: string,
    @Param('id') dealId: string,
    @Param('quotationId') quotationId: string,
  ) {
    return this.dealsService.deleteQuotation(workspaceId, dealId, quotationId);
  }

  // ─── QUOTATION ITEMS ──────────────────────────────────────────────────────

  @Post(':id/quotations/:quotationId/items')
  addItem(
    @Param('workspaceId') workspaceId: string,
    @Param('id') dealId: string,
    @Param('quotationId') quotationId: string,
    @Body() dto: AddQuotationItemDto,
  ) {
    return this.dealsService.addItem(workspaceId, dealId, quotationId, dto);
  }

  @Patch(':id/quotations/:quotationId/items/:itemId')
  updateItem(
    @Param('workspaceId') workspaceId: string,
    @Param('id') dealId: string,
    @Param('quotationId') quotationId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateQuotationItemDto,
  ) {
    return this.dealsService.updateItem(
      workspaceId,
      dealId,
      quotationId,
      itemId,
      dto,
    );
  }

  @Delete(':id/quotations/:quotationId/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteItem(
    @Param('workspaceId') workspaceId: string,
    @Param('id') dealId: string,
    @Param('quotationId') quotationId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.dealsService.deleteItem(
      workspaceId,
      dealId,
      quotationId,
      itemId,
    );
  }

  // ─── PAYMENT PLAN ─────────────────────────────────────────────────────────

  @Post(':id/payment-plan')
  createOrUpdatePaymentPlan(
    @Param('workspaceId') workspaceId: string,
    @Param('id') dealId: string,
    @Body() dto: CreatePaymentPlanDto,
  ) {
    return this.dealsService.createOrUpdatePaymentPlan(
      workspaceId,
      dealId,
      dto,
    );
  }

  @Get(':id/payment-plan')
  findPaymentPlan(
    @Param('workspaceId') workspaceId: string,
    @Param('id') dealId: string,
  ) {
    return this.dealsService.findPaymentPlan(workspaceId, dealId);
  }

  // ─── PAYMENT MILESTONES ───────────────────────────────────────────────────

  @Post(':id/payment-plan/milestones')
  addMilestone(
    @Param('workspaceId') workspaceId: string,
    @Param('id') dealId: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    return this.dealsService.addMilestone(workspaceId, dealId, dto);
  }

  @Patch(':id/payment-plan/milestones/:milestoneId')
  updateMilestone(
    @Param('workspaceId') workspaceId: string,
    @Param('id') dealId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return this.dealsService.updateMilestone(
      workspaceId,
      dealId,
      milestoneId,
      dto,
    );
  }

  @Delete(':id/payment-plan/milestones/:milestoneId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMilestone(
    @Param('workspaceId') workspaceId: string,
    @Param('id') dealId: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.dealsService.deleteMilestone(workspaceId, dealId, milestoneId);
  }
}
