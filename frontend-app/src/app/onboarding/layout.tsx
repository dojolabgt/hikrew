'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';

/**
 * Onboarding layout — clean full-page, no sidebar.
 * Requires the user to be authenticated; redirects to /login otherwise.
 * If onboarding is already completed, redirects to /dashboard.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    const { user, activeWorkspace, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        // Not logged in → login
        if (!user) {
            router.replace('/login');
            return;
        }

        // Already completed onboarding → skip to dashboard
        if (activeWorkspace?.onboardingCompleted) {
            router.replace('/dashboard');
        }
    }, [isLoading, user, activeWorkspace, router]);

    if (isLoading) return null;
    if (!user) return null;
    if (activeWorkspace?.onboardingCompleted) return null; // wait for redirect

    return <>{children}</>;
}
