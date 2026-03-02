import { User } from '@/types';
import { FreelancerProfile } from '@/features/freelancer-profile/types';

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
    freelancerProfile: FreelancerProfile | null;
    isLoading: boolean;
    error: string | null;
}

export interface AuthContextType extends AuthState {
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    clearError: () => void;
}
