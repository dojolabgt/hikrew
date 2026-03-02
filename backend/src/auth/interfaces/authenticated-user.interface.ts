import { UserRole } from '../constants/roles';
import { WorkspaceMember } from '../../workspaces/workspace-member.entity';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  workspaceMembers?: WorkspaceMember[];
}
