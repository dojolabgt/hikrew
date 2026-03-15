'use client';

import { useRequireRole } from '@/features/auth/hooks/useRequireRole';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserRole } from '@/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { NavItemConfig } from '@/components/layout/NavItem';
import { LayoutDashboard, Users, Briefcase, FileText, CreditCard, LayoutTemplate, Network, FolderKanban } from 'lucide-react';
import { TopHeader } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Settings } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';

export default function FreelancerLayout({ children }: { children: React.ReactNode }) {
    const { isAuthorized, isLoading } = useRequireRole(UserRole.FREELANCER);
    const { user, activeWorkspace } = useAuth();
    const router = useRouter();
    const { t } = useWorkspaceSettings();

    const freelancerNavItems: NavItemConfig[] = [
        { href: '/dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard, section: t('sidebar.mainSection') },
        { href: '/dashboard/clients', label: t('sidebar.clients'), icon: Users, section: t('sidebar.businessSection') },
        { href: '/dashboard/network', label: 'Mi Red', icon: Network, section: t('sidebar.businessSection') },
        { href: '/dashboard/services', label: t('sidebar.services'), icon: Briefcase, section: t('sidebar.businessSection') },
        { href: '/dashboard/deals', label: t('sidebar.deals'), icon: FileText, section: t('sidebar.billingSection') },
        { href: '/dashboard/projects', label: 'Proyectos', icon: FolderKanban, section: t('sidebar.billingSection') },
        { href: '/dashboard/templates', label: t('sidebar.templates'), icon: LayoutTemplate, section: t('sidebar.billingSection') },
        { href: '/dashboard/payments', label: t('sidebar.payments'), icon: CreditCard, section: t('sidebar.billingSection') },
        { href: '/dashboard/settings/personal-info', label: t('sidebar.settings'), icon: Settings, section: t('sidebar.settingsSection') },
    ];

    // Guard: redirect to onboarding if not completed yet
    useEffect(() => {
        if (!isLoading && isAuthorized && activeWorkspace && !activeWorkspace.onboardingCompleted) {
            router.replace('/onboarding');
        }
    }, [isLoading, isAuthorized, activeWorkspace, router]);

    if (isLoading) return null;
    if (!isAuthorized || !user) return null;
    if (activeWorkspace && !activeWorkspace.onboardingCompleted) return null; // wait for redirect

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
            <Sidebar navItems={freelancerNavItems} />
            <main className="flex-1 flex flex-col min-w-0">
                <TopHeader />
                <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
                    {children}
                </div>
            </main>
            <MobileBottomNav navItems={freelancerNavItems} />
        </div>
    );
}
