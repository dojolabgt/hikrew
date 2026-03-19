import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import { AuthRequest } from '../types/auth-request';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly workspacesService: WorkspacesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;
    const workspaceId = request.headers['x-workspace-id'] as string | undefined;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    if (!workspaceId) {
      throw new BadRequestException('x-workspace-id header is missing');
    }

    const members = await this.workspacesService.findByUserId(user.id);
    const membership = members.find((m) => m.workspaceId === workspaceId);

    if (!membership) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    // Clients are not allowed to use the workspace dashboard API
    if (membership.role === 'client') {
      throw new ForbiddenException('Client accounts cannot access the workspace dashboard');
    }

    // Inject workspace membership data into request for downstream controllers
    request.workspaceId = workspaceId;
    request.workspaceRole = membership.role;

    return true;
  }
}
