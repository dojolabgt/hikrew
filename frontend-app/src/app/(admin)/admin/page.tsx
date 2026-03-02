'use client';

import { DashboardShell, Surface } from "@/components/layout/DashboardShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserRole } from "@/lib/types/enums";
import { LayoutDashboard, Users, Settings } from "lucide-react";

// In a real app, you'd get the user from a server component or pass it down via React Context
// For now, these are placeholders to demonstrate the layout.
const mockUser = {
    id: "1",
    email: "admin@blend.com",
    role: UserRole.ADMIN,
    firstName: "Admin",
    lastName: "User",
    status: "active" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

const navItems = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Usuarios', icon: Users },
];

export default function AdminDashboardPage() {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar
                navItems={navItems}
            />
            <DashboardShell>
                <Surface>
                    <h1 className="text-3xl font-bold tracking-tight mb-4">Admin Dashboard</h1>
                    <p className="text-zinc-500">Bienvenido al panel de administración.</p>
                </Surface>
            </DashboardShell>
        </div>
    );
}
