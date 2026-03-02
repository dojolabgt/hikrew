'use client';

import React, { createContext, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { UserRole } from '@/types';
import type { User } from '@/types';
import type { AuthContextType, LoginCredentials, RegisterCredentials } from '../types/auth.types';

import { freelancerProfileApi } from '@/features/freelancer-profile/api';
import type { FreelancerProfile } from '@/features/freelancer-profile/types';

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
    const [freelancerProfile, setFreelancerProfile] = useState<FreelancerProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkAuth = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get<User>('/auth/me');
            setUser(response.data);

            if (response.data.role === UserRole.FREELANCER) {
                try {
                    const profileData = await freelancerProfileApi.getProfile();
                    setFreelancerProfile(profileData);
                } catch (profileError) {
                    console.error('Error fetching freelancer profile in AuthContext:', profileError);
                }
            }

            setError(null);
        } catch (err) {
            setUser(null);
            setFreelancerProfile(null);
            // Don't set error state on initial load, it just means they aren't logged in
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial check on mount
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Listen for custom logout events from the interceptor (e.g., token expired)
    useEffect(() => {
        const handleForceLogout = () => {
            setUser(null);
            setFreelancerProfile(null);
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
                try {
                    const profileData = await freelancerProfileApi.getProfile();
                    setFreelancerProfile(profileData);
                } catch (profileError) {
                    console.error('Error fetching freelancer profile in AuthContext:', profileError);
                }
            }

            // Redirect based on the unified UserRole Enum mapping
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

            // Fetch profile right after register if FREELANCER
            if (response.data.user.role === UserRole.FREELANCER) {
                try {
                    const profileData = await freelancerProfileApi.getProfile();
                    setFreelancerProfile(profileData);
                } catch (profileError) {
                    console.error('Error fetching freelancer profile in AuthContext:', profileError);
                }
            }

            // Redirect based on role
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
            setFreelancerProfile(null);
            router.push('/login');
            setIsLoading(false);
        }
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider
            value={{
                user,
                freelancerProfile,
                isLoading,
                error,
                login,
                register,
                logout,
                checkAuth,
                clearError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
