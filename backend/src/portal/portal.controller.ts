import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PortalService } from './portal.service';
import type { AuthRequest } from '../common/types/auth-request';

@Controller('portal')
@UseGuards(JwtAuthGuard)
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  /** GET /portal/deals — list all deals for the authenticated client */
  @Get('deals')
  getMyDeals(@Req() req: AuthRequest) {
    return this.portalService.getDealsForUser(req.user.id);
  }

  /** GET /portal/deals/:token — full deal detail */
  @Get('deals/:token')
  getDeal(@Param('token') token: string, @Req() req: AuthRequest) {
    return this.portalService.getDealByToken(req.user.id, token);
  }

  /** GET /portal/deals/:token/assets — list Drive files */
  @Get('deals/:token/assets')
  getAssets(@Param('token') token: string, @Req() req: AuthRequest) {
    return this.portalService.getDealAssets(req.user.id, token);
  }

  /** POST /portal/deals/:token/assets — upload file to Drive */
  @Post('deals/:token/assets')
  @UseInterceptors(FileInterceptor('file'))
  uploadAsset(
    @Param('token') token: string,
    @Req() req: AuthRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.portalService.uploadDealAsset(req.user.id, token, file);
  }
}
