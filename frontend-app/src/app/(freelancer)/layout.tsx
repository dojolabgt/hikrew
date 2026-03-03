'use client';

import { useRequireRole } from '@/features/auth/hooks/useRequireRole';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserRole } from '@/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { NavItemConfig } from '@/components/layout/NavItem';
import { LayoutDashboard, Users, Briefcase, FileText, CreditCard } from 'lucide-react';
import { TopHeader } from '@/components/layout/Header';
import { Settings } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const freelancerNavItems: NavItemConfig[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'GENERAL' },
    { href: '/dashboard/clients', label: 'Directorio', icon: Users, section: 'NEGOCIO' },
    { href: '/dashboard/services', label: 'Servicios', icon: Briefcase, section: 'NEGOCIO' },
    { href: '/dashboard/quotes', label: 'Cotizaciones', icon: FileText, section: 'COBROS' },
    { href: '/dashboard/payments', label: 'Pagos', icon: CreditCard, section: 'COBROS' },
    // Use strongly typed route to default settings page
    { href: '/dashboard/settings/personal-info', label: 'Configuración', icon: Settings, section: 'CONFIGURACIÓN' },
];

export default function FreelancerLayout({ children }: { children: React.ReactNode }) {
    const { isAuthorized, isLoading } = useRequireRole(UserRole.FREELANCER);
    const { user, activeWorkspace } = useAuth();
    const router = useRouter();

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
            <Sidebar
                navItems={freelancerNavItems}
            />
            <main className="flex-1 flex flex-col w-full relative">
                <TopHeader />
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
