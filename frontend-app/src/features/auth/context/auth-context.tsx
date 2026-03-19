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
 * Determines the correct post-login destination based on workspace memberships.
 * Priority: admin > context selector (dual role) > portal (client only) > dashboard
 */
function getPostLoginRoute(user: User): string {
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPPORT) return '/admin';

    const ownerMemberships = user.workspaceMembers?.filter(
        (wm) => wm.role === 'owner' || wm.role === 'collaborator',
    ) ?? [];
    const clientMemberships = user.workspaceMembers?.filter((wm) => wm.role === 'client') ?? [];

    // Legacy: user-level CLIENT role (pre-migration data)
    if (user.role === UserRole.CLIENT) return '/portal';

    if (ownerMemberships.length > 0 && clientMemberships.length > 0) return '/select-context';
    if (clientMemberships.length > 0) return '/portal';
    return '/dashboard';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
    const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkAndSetWorkspace = (userData: User) => {
        // Only consider non-CLIENT memberships for the active workspace context
        const memberships = userData.workspaceMembers?.filter((wm) => wm.role !== 'client') ?? [];
        if (memberships.length === 0) return;

        let storedId = localStorage.getItem('activeWorkspaceId');
        let workspaceData = memberships.find((wm) => wm.workspaceId === storedId);

        if (!workspaceData) {
            workspaceData = memberships[0];
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

            const hasDashboardAccess = response.data.workspaceMembers?.some(
                (wm) => wm.role === 'owner' || wm.role === 'collaborator',
            );
            if (hasDashboardAccess) {
                checkAndSetWorkspace(response.data);
            }

            setError(null);
        } catch {
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
            const userData = response.data.user;
            setUser(userData);

            const ownerMemberships = userData.workspaceMembers?.filter(
                (wm) => wm.role === 'owner' || wm.role === 'collaborator',
            ) ?? [];

            if (ownerMemberships.length > 0) {
                checkAndSetWorkspace(userData);

                // Redirect to onboarding if the first owned workspace hasn't completed it
                const workspace = ownerMemberships[0]?.workspace;
                if (workspace && !workspace.onboardingCompleted) {
                    router.push('/onboarding');
                    return;
                }
            }

            router.push(getPostLoginRoute(userData));
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
            setError(apiErr.response?.data?.message || 'Error occurred during login');
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

            checkAndSetWorkspace(response.data.user);

            // Always send new registrations to onboarding
            router.push('/onboarding');
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
            setError(apiErr.response?.data?.message || 'Error occurred during registration');
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
