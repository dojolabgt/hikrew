'use client';

import { useRequireRole } from '@/features/auth/hooks/useRequireRole';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserRole } from '@/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { NavItemConfig } from '@/components/layout/NavItem';
import { LayoutDashboard, Users, Briefcase, FileText, CreditCard, LayoutTemplate, Network, FolderKanban, HardDrive } from 'lucide-react';
import { TopHeader } from '@/components/layout/Header';
import { MobileHeader } from '@/components/layout/MobileHeader';
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
        { href: '/dashboard/clients', label: t('sidebar.clients'), icon: Users, section: t('sidebar.peopleSection') },
        { href: '/dashboard/network', label: t('sidebar.network'), icon: Network, section: t('sidebar.peopleSection') },
        { href: '/dashboard/deals', label: t('sidebar.deals'), icon: FileText, section: t('sidebar.workSection') },
        { href: '/dashboard/projects', label: t('sidebar.projects'), icon: FolderKanban, section: t('sidebar.workSection') },
        { href: '/dashboard/payments', label: t('sidebar.payments'), icon: CreditCard, section: t('sidebar.workSection') },
        { href: '/dashboard/files', label: t('sidebar.files'), icon: HardDrive, section: t('sidebar.toolsSection') },
        { href: '/dashboard/services', label: t('sidebar.services'), icon: Briefcase, section: t('sidebar.toolsSection') },
        { href: '/dashboard/templates', label: t('sidebar.templates'), icon: LayoutTemplate, section: t('sidebar.toolsSection') },
        { href: '/dashboard/settings/personal-info', label: t('sidebar.settings'), icon: Settings, section: t('sidebar.settingsSection') },
    ];

    // Guard: redirect to onboarding if no workspace yet or onboarding incomplete
    useEffect(() => {
        if (!isLoading && isAuthorized) {
            if (!activeWorkspace || !activeWorkspace.onboardingCompleted) {
                router.replace('/onboarding');
            }
        }
    }, [isLoading, isAuthorized, activeWorkspace, router]);

    if (isLoading) return null;
    if (!isAuthorized || !user) return null;
    // Block render until workspace is confirmed — prevents API calls without x-workspace-id
    if (!activeWorkspace || !activeWorkspace.onboardingCompleted) return null;

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
            <Sidebar navItems={freelancerNavItems} />
            <main className="flex-1 flex flex-col min-w-0">
                <MobileHeader />
                <TopHeader />
                <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
                    {children}
                </div>
            </main>
            <MobileBottomNav navItems={freelancerNavItems} />
        </div>
    );
}
