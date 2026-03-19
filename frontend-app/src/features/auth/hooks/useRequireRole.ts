'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import { UserRole } from '@/types';

/**
 * Validates that the current user has the exact required role.
 * If not, redirects them relative to their actual role, or to /login.
 */
export function useRequireRole(requiredRole: UserRole) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    // In the new multi-role model all non-admin users have role='freelancer' at DB level.
    // A "freelancer" for dashboard purposes must have at least one owner/collaborator membership.
    // Pure clients (only 'client' memberships) should be sent to /portal instead.
    const hasOwnerAccess = user?.workspaceMembers?.some(
        (wm) => wm.role === 'owner' || wm.role === 'collaborator',
    ) ?? false;

    const isAuthorized = Boolean(
        user &&
        user.role === requiredRole &&
        (requiredRole !== UserRole.FREELANCER || hasOwnerAccess),
    );

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.replace('/login');
                return;
            }

            if (!isAuthorized) {
                const hasClientOnly = user.workspaceMembers?.every((wm) => wm.role === 'client');
                if (user.role === UserRole.ADMIN || user.role === UserRole.SUPPORT) router.replace('/admin');
                else if (hasClientOnly) router.replace('/portal');
                else if (user.role === UserRole.CLIENT) router.replace('/portal');
                else router.replace('/login');
            }
        }
    }, [user, isLoading, isAuthorized, router]);

    return { user, isLoading, isAuthorized };
}

/**
 * Validates that the user has at least one CLIENT workspace membership.
 * Replaces the legacy useRequireRole(UserRole.CLIENT) check.
 */
export function useRequireClientMembership() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    const hasClientMembership =
        // New model: workspace-level CLIENT role
        user?.workspaceMembers?.some((wm) => wm.role === 'client') ??
        // Legacy fallback: user-level CLIENT role (during migration)
        false;

    const isLegacyClient = user?.role === UserRole.CLIENT;

    const isAuthorized = Boolean(user && (hasClientMembership || isLegacyClient));

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.replace('/login');
                return;
            }
            if (!isAuthorized) {
                router.replace('/dashboard');
            }
        }
    }, [user, isLoading, isAuthorized, router]);

    return { user, isLoading, isAuthorized };
}

/**
 * Validates that the current user has AT LEAST ONE of the allowed roles.
 */
export function useRequireRoles(allowedRoles: readonly UserRole[]) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.replace('/login');
                return;
            }

            if (!allowedRoles.includes(user.role)) {
                // Return to their actual base location
                if (user.role === UserRole.FREELANCER) router.replace('/dashboard');
                else if (user.role === UserRole.ADMIN || user.role === UserRole.SUPPORT) router.replace('/admin');
                else if (user.role === UserRole.CLIENT) router.replace('/portal');
                else router.replace('/login');
            }
        }
    }, [user, isLoading, allowedRoles, router]);

    return { user, isLoading, isAuthorized: Boolean(user && allowedRoles.includes(user.role)) };
}
