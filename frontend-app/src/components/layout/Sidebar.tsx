'use client';

import { LogOut } from 'lucide-react';
import { NavItem, NavItemConfig } from './NavItem';
import { cn, getImageUrl } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SidebarProps {
    navItems: NavItemConfig[];
}

export function Sidebar({ navItems }: SidebarProps) {
    const { user, activeWorkspace, activeWorkspaceId, switchWorkspace, logout } = useAuth();

    const groupedItems = navItems.reduce((acc, item) => {
        const section = item.section || 'MAIN NAVIGATION';
        if (!acc[section]) acc[section] = [];
        acc[section].push(item);
        return acc;
    }, {} as Record<string, NavItemConfig[]>);

    const isProOrPremium = activeWorkspace?.plan === 'pro' || activeWorkspace?.plan === 'premium';
    const businessName = isProOrPremium ? (activeWorkspace?.businessName || 'Mi Espacio') : 'Hi Krew';
    const displayLogo = isProOrPremium ? (activeWorkspace?.logo || undefined) : '/HiKrewLogo.png';
    const initials = isProOrPremium ? businessName.substring(0, 2).toUpperCase() : 'HK';
    const brandColorStyle = (isProOrPremium && activeWorkspace?.brandColor) ? { color: activeWorkspace.brandColor } : {};

    const userFullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Usuario';
    const userInitial = (user?.firstName?.[0] || user?.email?.[0] || '?').toUpperCase();

    return (
        <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-800/60 shrink-0">
                {/* Brand / Logo header */}
                <div className="h-14 flex items-center px-4 border-b border-zinc-100 dark:border-zinc-800/60 shrink-0 gap-2.5">
                    <Avatar className="w-7 h-7 rounded-lg shrink-0 border border-zinc-200 dark:border-zinc-700">
                        <AvatarImage src={getImageUrl(displayLogo)} alt={businessName} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary rounded-lg text-xs font-bold" style={brandColorStyle}>
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-sm text-zinc-900 dark:text-white tracking-tight truncate flex-1" title={businessName}>
                        {businessName}
                    </span>
                    {user?.workspaceMembers && user.workspaceMembers.length > 1 && (
                        <select
                            className="bg-transparent text-zinc-400 text-xs p-1 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded outline-none shrink-0"
                            value={activeWorkspaceId || ''}
                            onChange={(e) => switchWorkspace(e.target.value)}
                        >
                            {user.workspaceMembers.map(wm => (
                                <option key={wm.workspaceId} value={wm.workspaceId}>
                                    {wm.workspace.businessName}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
                    <div className="space-y-6">
                        {Object.entries(groupedItems).map(([section, items]) => (
                            <div key={section}>
                                <p className="px-3 mb-1.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase">
                                    {section}
                                </p>
                                <div className="space-y-0.5">
                                    {items.map((item) => (
                                        <NavItem
                                            key={item.href}
                                            item={item}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </nav>

                {/* Footer: user info + logout */}
                <div className="shrink-0 border-t border-zinc-100 dark:border-zinc-800/60 p-3">
                    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
                        <Avatar className="h-7 w-7 border border-zinc-200 dark:border-zinc-700 shrink-0">
                            <AvatarImage src={getImageUrl(user?.profileImage)} alt={userFullName} className="object-cover" />
                            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold text-xs uppercase">
                                {userInitial}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate leading-tight">
                                {userFullName}
                            </p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-tight">
                                {user?.email}
                            </p>
                        </div>
                        <button
                            onClick={logout}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shrink-0"
                            title="Cerrar sesión"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
        </aside>
    );
}
