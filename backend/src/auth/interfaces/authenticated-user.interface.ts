import { UserRole } from '../constants/roles';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}
