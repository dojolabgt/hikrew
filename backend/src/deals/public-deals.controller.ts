import {
  Controller,
  Get,
  Post,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { DealsService } from './deals.service';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('public/deals')
export class PublicDealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get(':token')
  async getPublicDeal(@Param('token') token: string) {
    const deal = await this.dealsService.getPublicDeal(token);
    if (!deal) {
      throw new NotFoundException('Propuesta no encontrada o enlace inválido');
    }
    return deal;
  }

  @Post(':token/approve-quotation/:quotationId')
  async approveQuotation(
    @Param('token') token: string,
    @Param('quotationId') quotationId: string,
  ) {
    return this.dealsService.approvePublicQuotation(token, quotationId);
  }
}
