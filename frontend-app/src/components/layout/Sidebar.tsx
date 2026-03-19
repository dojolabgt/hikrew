'use client';

import { LogOut, ChevronsUpDown, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { NavItem, NavItemConfig } from './NavItem';
import { cn, getImageUrl } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
    navItems: NavItemConfig[];
}

export function Sidebar({ navItems }: SidebarProps) {
    const { user, activeWorkspace, activeWorkspaceId, switchWorkspace, logout } = useAuth();

    // Only show owner/collaborator workspaces in the switcher — never client workspaces
    const ownerWorkspaces = user?.workspaceMembers?.filter(
        (wm) => wm.role === 'owner' || wm.role === 'collaborator',
    ) ?? [];

    const clientWorkspaces = user?.workspaceMembers?.filter(
        (wm) => wm.role === 'client',
    ) ?? [];

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
        <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-[#111111] border-r border-gray-200/80 dark:border-white/[0.06] shrink-0">

            {/* ── Brand header ── */}
            <div className="h-16 flex items-center px-4 shrink-0 border-b border-gray-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="w-9 h-9 rounded-xl shrink-0 ring-1 ring-gray-200 dark:ring-white/[0.12] shadow-sm">
                        <AvatarImage src={getImageUrl(displayLogo)} alt={businessName} className="object-cover" />
                        <AvatarFallback
                            className="rounded-xl text-[13px] font-bold bg-zinc-900 dark:bg-zinc-800 text-white"
                            style={brandColorStyle}
                        >
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <span
                            className="block font-bold text-[15px] text-gray-900 dark:text-white tracking-tight truncate leading-tight"
                            title={businessName}
                        >
                            {businessName}
                        </span>
                        <span className="block text-[11px] text-gray-500 dark:text-white/50 leading-tight">
                            Dashboard
                        </span>
                    </div>
                </div>

                {ownerWorkspaces.length > 1 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors outline-none">
                                <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400 dark:text-white/40" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                            {ownerWorkspaces.map((wm) => (
                                <DropdownMenuItem
                                    key={wm.workspaceId}
                                    onClick={() => switchWorkspace(wm.workspaceId)}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Avatar className="h-5 w-5 rounded-md shrink-0">
                                        <AvatarImage src={getImageUrl(wm.workspace.logo)} className="object-cover" />
                                        <AvatarFallback className="text-[9px] font-bold bg-zinc-200 dark:bg-zinc-700 rounded-md">
                                            {wm.workspace.businessName?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="flex-1 truncate text-sm">{wm.workspace.businessName}</span>
                                    {wm.workspaceId === activeWorkspaceId && (
                                        <Check className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-hide">
                <div className="space-y-5">
                    {Object.entries(groupedItems).map(([section, items]) => (
                        <div key={section}>
                            <p className="px-3 mb-2 text-[10px] font-semibold tracking-widest text-gray-500 dark:text-white/40 uppercase select-none">
                                {section}
                            </p>
                            <div className="space-y-0.5">
                                {items.map((item) => (
                                    <NavItem key={item.href} item={item} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </nav>

            {/* ── Client portal link ── */}
            {clientWorkspaces.length > 0 && (
                <div className="shrink-0 px-3 pb-1 border-t border-gray-100 dark:border-white/[0.06] pt-3">
                    <Link
                        href="/portal"
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all duration-200 group"
                    >
                        <div className="h-5 w-5 rounded-md bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                            <ExternalLink className="h-3 w-3" />
                        </div>
                        <span className="flex-1 text-[12px] font-medium truncate">
                            {clientWorkspaces.length === 1
                                ? `Portal · ${clientWorkspaces[0].workspace.businessName}`
                                : `Portal de cliente (${clientWorkspaces.length})`
                            }
                        </span>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </Link>
                </div>
            )}

            {/* ── User footer ── */}
            <div className={cn("shrink-0 p-3 border-t border-gray-100 dark:border-white/[0.06]", clientWorkspaces.length > 0 && "border-t-0")}>
                <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all duration-200 group cursor-default">
                    <Avatar className="h-8 w-8 ring-1 ring-gray-200 dark:ring-white/[0.12] shrink-0">
                        <AvatarImage src={getImageUrl(user?.profileImage)} alt={userFullName} className="object-cover" />
                        <AvatarFallback className="bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 font-bold text-[11px] uppercase">
                            {userInitial}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800 dark:text-white/90 truncate leading-tight">
                            {userFullName}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-white/50 truncate leading-tight">
                            {user?.email}
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        className="p-1.5 rounded-lg text-gray-400 dark:text-white/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-all duration-200 shrink-0 opacity-0 group-hover:opacity-100"
                        title="Cerrar sesión"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

        </aside>
    );
}
