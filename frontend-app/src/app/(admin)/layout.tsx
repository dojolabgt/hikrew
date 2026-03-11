'use client';

import { useRequireRoles } from '@/features/auth/hooks/useRequireRole';
import { ADMIN_ROLES } from '@/types';

import { Sidebar } from "@/components/layout/Sidebar";
import { LayoutDashboard, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";

const navItems = [
    { href: '/admin/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Usuarios', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAuthorized, isLoading } = useRequireRoles(ADMIN_ROLES);

    if (isLoading) return null; // Or a full-screen spinner
    if (!isAuthorized) return null;

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
            <Sidebar navItems={navItems} />
            <DashboardShell>
                <main className="flex-1 w-full relative">
                    {children}
                </main>
            </DashboardShell>
        </div>
    );
}
