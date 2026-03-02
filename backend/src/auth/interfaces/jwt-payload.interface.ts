import { UserRole } from '../constants/roles';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  workspaces?: { id: string; role: string; businessName: string }[];
}
