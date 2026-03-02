'use client';

import { useRequireRole } from '@/features/auth/hooks/useRequireRole';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserRole } from '@/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { NavItemConfig } from '@/components/layout/NavItem';
import { LayoutDashboard, Users, Briefcase, FileText, CreditCard, UserSquare, Sparkles } from 'lucide-react';

import { TopHeader } from '@/components/layout/Header';
import { Settings } from 'lucide-react';

const freelancerNavItems: NavItemConfig[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'GENERAL' },
    { href: '/dashboard/clients', label: 'Directorio', icon: Users, section: 'NEGOCIO' },
    { href: '/dashboard/services', label: 'Servicios', icon: Briefcase, section: 'NEGOCIO' },
    { href: '/dashboard/quotes', label: 'Cotizaciones', icon: FileText, section: 'COBROS' },
    { href: '/dashboard/payments', label: 'Pagos', icon: CreditCard, section: 'COBROS' },
    { href: '/dashboard/profile', label: 'Mi Perfil', icon: UserSquare, section: 'CONFIGURACIÓN' },
    { href: '/dashboard/settings', label: 'Integraciones', icon: Settings, section: 'CONFIGURACIÓN' },
    { href: '/dashboard/billing', label: 'Mi Plan', icon: Sparkles, section: 'CONFIGURACIÓN' },
];

export default function FreelancerLayout({ children }: { children: React.ReactNode }) {
    const { isAuthorized, isLoading } = useRequireRole(UserRole.FREELANCER);
    const { user, logout } = useAuth();

    if (isLoading) return null; // Or a full-screen spinner
    if (!isAuthorized || !user) return null;

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
