import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DealsService } from './deals.service';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('public/deals')
export class PublicDealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get(':token')
  async getPublicDeal(
    @Param('token') token: string,
    @Query('password') password?: string,
  ) {
    const deal = await this.dealsService.getPublicDeal(token, password);
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

  @Post(':token/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('token') token: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.dealsService.uploadPublicFile(token, file);
  }
}
