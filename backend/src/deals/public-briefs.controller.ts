import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DealsService } from './deals.service';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('public/briefs')
export class PublicBriefsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get(':token')
  async getPublicBrief(@Param('token') token: string) {
    return this.dealsService.getPublicBrief(token);
  }

  @Post(':token/submit')
  async submitPublicBrief(
    @Param('token') token: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.dealsService.submitPublicBrief(token, body);
  }
}
