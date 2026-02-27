import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserRole } from '@/lib/types/enums';

/**
 * Hook to require a specific role for accessing a component/page
 * Redirects to dashboard if user doesn't have the required role
 * 
 * @param requiredRole - The role required to access the component
 * @param redirectTo - Optional path to redirect to if unauthorized (defaults to /dashboard)
 * @returns Object with user and loading state
 */
export function useRequireRole(requiredRole: UserRole, redirectTo: string = '/dashboard') {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.replace('/login');
            } else if (user.role !== requiredRole) {
                router.replace(redirectTo);
            }
        }
    }, [isLoading, user, requiredRole, redirectTo, router]);

    return { user, isLoading };
}

/**
 * Hook to require one of multiple roles
 * 
 * @param allowedRoles - Array of roles that are allowed to access
 * @param redirectTo - Optional path to redirect to if unauthorized
 * @returns Object with user and loading state
 */
export function useRequireRoles(allowedRoles: UserRole[], redirectTo: string = '/dashboard') {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.replace('/login');
            } else if (!allowedRoles.includes(user.role as UserRole)) {
                router.replace(redirectTo);
            }
        }
    }, [isLoading, user, allowedRoles, redirectTo, router]);

    return { user, isLoading };
}
