import { User } from '@/types';
import { Workspace } from '@/features/workspaces/types';

export interface LoginCredentials {
    email: string;
    password?: string;
    // other fields like token for magic links can go here future
}

export interface RegisterCredentials {
    email: string;
    password?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
}

export interface AuthState {
    user: User | null;
    activeWorkspaceId: string | null;
    activeWorkspace: Workspace | null;
    isLoading: boolean;
    error: string | null;
}

export interface AuthContextType extends AuthState {
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    switchWorkspace: (workspaceId: string) => void;
    clearError: () => void;
}
