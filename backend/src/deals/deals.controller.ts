import { Controller, Get, Post, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { CreateBriefTemplateDto } from './dto/create-brief-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('workspaces/:workspaceId/deals')
export class DealsController {
    constructor(private readonly dealsService: DealsService) { }

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

    // --- BRIEF TEMPLATES (Must be above /:id) ---

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

    @Post('brief-templates/:id')
    updateBriefTemplate(
        @Param('workspaceId') workspaceId: string,
        @Param('id') id: string,
        @Body() dto: Partial<CreateBriefTemplateDto>,
    ) {
        return this.dealsService.updateBriefTemplate(workspaceId, id, dto);
    }

    // --- DEAL BY ID ---

    @Get(':id')
    findOne(
        @Param('workspaceId') workspaceId: string,
        @Param('id') id: string,
    ) {
        return this.dealsService.findOne(workspaceId, id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteDeal(
        @Param('workspaceId') workspaceId: string,
        @Param('id') id: string,
    ) {
        return this.dealsService.deleteDeal(workspaceId, id);
    }
}
