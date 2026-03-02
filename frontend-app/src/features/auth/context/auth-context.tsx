'use client';

import React, { createContext, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { UserRole } from '@/types';
import type { User } from '@/types';
import type { AuthContextType, LoginCredentials, RegisterCredentials } from '../types/auth.types';
import type { Workspace } from '@/features/workspaces/types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Maps a UserRole directly to its intended dashboard route.
 */
function getDashboardRoute(role: UserRole): string {
    switch (role) {
        case UserRole.ADMIN:
        case UserRole.SUPPORT:
            return '/admin';
        case UserRole.FREELANCER:
            return '/dashboard';
        case UserRole.CLIENT:
            return '/portal';
        default:
            return '/login';
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
    const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkAndSetWorkspace = (userData: User) => {
        if (!userData.workspaceMembers || userData.workspaceMembers.length === 0) return;
        let storedId = localStorage.getItem('activeWorkspaceId');

        // Check if storedId is valid for the user
        let workspaceData = userData.workspaceMembers.find(wm => wm.workspaceId === storedId);

        // Fallback to first available workspace normally OWNER if sorted
        if (!workspaceData) {
            workspaceData = userData.workspaceMembers[0];
            storedId = workspaceData.workspaceId;
            localStorage.setItem('activeWorkspaceId', storedId);
        }

        setActiveWorkspaceId(workspaceData.workspaceId);
        setActiveWorkspace(workspaceData.workspace);
    };

    const switchWorkspace = (workspaceId: string) => {
        if (!user || !user.workspaceMembers) return;

        const workspaceData = user.workspaceMembers.find(wm => wm.workspaceId === workspaceId);
        if (workspaceData) {
            localStorage.setItem('activeWorkspaceId', workspaceId);
            setActiveWorkspaceId(workspaceId);
            setActiveWorkspace(workspaceData.workspace);

            // Reload page or re-fetch queries depending on routing implementation
            // Using straight push/refresh to reload data context globally.
            router.refresh();
        }
    };

    const checkAuth = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get<User>('/auth/me');
            setUser(response.data);

            if (response.data.role === UserRole.FREELANCER) {
                checkAndSetWorkspace(response.data);
            }

            setError(null);
        } catch (err) {
            setUser(null);
            setActiveWorkspace(null);
            setActiveWorkspaceId(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial check on mount
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Listen for custom logout events from the interceptor
    useEffect(() => {
        const handleForceLogout = () => {
            setUser(null);
            setActiveWorkspace(null);
            setActiveWorkspaceId(null);
            localStorage.removeItem('activeWorkspaceId');
            router.push('/login');
        };
        window.addEventListener('auth-logout', handleForceLogout);
        return () => window.removeEventListener('auth-logout', handleForceLogout);
    }, [router]);

    const login = async (credentials: LoginCredentials) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.post<{ user: User }>('/auth/login', credentials);
            setUser(response.data.user);

            if (response.data.user.role === UserRole.FREELANCER) {
                checkAndSetWorkspace(response.data.user);
            }

            router.push(getDashboardRoute(response.data.user.role));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error occurred during login');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (credentials: RegisterCredentials) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.post<{ user: User }>('/auth/register', credentials);
            setUser(response.data.user);

            if (response.data.user.role === UserRole.FREELANCER) {
                checkAndSetWorkspace(response.data.user);
            }

            router.push(getDashboardRoute(response.data.user.role));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error occurred during registration');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            await api.post('/auth/logout');
        } catch (err) {
            console.error('Logout failed:', err);
        } finally {
            setUser(null);
            setActiveWorkspace(null);
            setActiveWorkspaceId(null);
            localStorage.removeItem('activeWorkspaceId');
            router.push('/login');
            setIsLoading(false);
        }
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider
            value={{
                user,
                activeWorkspaceId,
                activeWorkspace,
                isLoading,
                error,
                login,
                register,
                logout,
                checkAuth,
                switchWorkspace,
                clearError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
