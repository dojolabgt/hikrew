import {
    Controller,
    Get,
    Req,
    UseGuards,
    Patch,
    Post,
    Body,
    UploadedFile,
    UseInterceptors,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
    constructor(private readonly workspacesService: WorkspacesService) { }

    @Get('my-workspaces')
    async getMyWorkspaces(@Req() req) {
        return this.workspacesService.findByUserId(req.user.id);
    }

    @Patch('current')
    @UseGuards(WorkspaceGuard)
    async updateWorkspace(@Req() req, @Body() data: any) {
        // Note: Request.workspaceId is set by the WorkspaceGuard!
        return this.workspacesService.updateWorkspace(req.workspaceId, data);
    }

    @Post('current/logo')
    @UseGuards(WorkspaceGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadLogo(
        @Req() req,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
                ],
            }),
        )
        file: Express.Multer.File,
    ) {
        return this.workspacesService.uploadLogo(req.workspaceId, file);
    }

    @Get('current/recurrente/status')
    @UseGuards(WorkspaceGuard)
    async getRecurrenteStatus(@Req() req) {
        return this.workspacesService.getRecurrenteStatus(req.workspaceId);
    }

    @Post('current/recurrente')
    @UseGuards(WorkspaceGuard)
    async updateRecurrenteKeys(@Req() req, @Body() body: any) {
        return this.workspacesService.updateRecurrenteKeys(req.workspaceId, body);
    }
}
