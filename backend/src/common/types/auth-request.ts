import { Request } from 'express';

/** Typed HTTP request after JWT + WorkspaceGuard have run */
export interface AuthRequest extends Request {
  user: { id: string; email: string };
  workspaceId: string;
  workspaceRole: string;
}
