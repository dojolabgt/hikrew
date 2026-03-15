'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { NavItem, NavItemConfig } from './NavItem';
import { cn, getImageUrl } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SidebarProps {
    navItems: NavItemConfig[];
}

export function Sidebar({ navItems }: SidebarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, activeWorkspace, activeWorkspaceId, switchWorkspace } = useAuth();

    // Group items by section
    const groupedItems = navItems.reduce((acc, item) => {
        const section = item.section || 'MAIN NAVIGATION';
        if (!acc[section]) acc[section] = [];
        acc[section].push(item);
        return acc;
    }, {} as Record<string, NavItemConfig[]>);

    // Branding Logic
    const isProOrPremium = activeWorkspace?.plan === 'pro' || activeWorkspace?.plan === 'premium';
    const businessName = isProOrPremium ? (activeWorkspace?.businessName || 'Mi Espacio') : 'Hi Krew';
    const displayLogo = isProOrPremium ? (activeWorkspace?.logo || undefined) : '/HiKrewLogo.png';
    const initials = isProOrPremium ? businessName.substring(0, 2).toUpperCase() : 'HK';

    // Optional style based on brandColor
    const brandColorStyle = (isProOrPremium && activeWorkspace?.brandColor) ? { color: activeWorkspace.brandColor } : {};

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 fixed top-0 w-full z-40 shadow-sm">
                <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8 rounded-lg shadow-sm border border-border">
                        <AvatarImage src={getImageUrl(displayLogo)} alt={businessName} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary rounded-lg text-xs" style={brandColorStyle}>
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-zinc-900 dark:text-white tracking-tight truncate max-w-[150px]">{businessName}</span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 -mr-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Main Sidebar Desktop + Mobile Menu */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-56 bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-800/60 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:flex-col",
                mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
            )}>

                {/* Logo Area & Switcher */}
                <div className="h-16 flex items-center px-6 border-b border-zinc-100 dark:border-zinc-800/60 justify-between shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Avatar className="w-8 h-8 rounded-lg shadow-sm border border-border">
                            <AvatarImage src={getImageUrl(displayLogo)} alt={businessName} className="object-cover" />
                            <AvatarFallback className="bg-primary/10 text-primary rounded-lg text-xs font-bold" style={brandColorStyle}>
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-lg text-zinc-900 dark:text-white tracking-tight truncate" title={businessName}>
                            {businessName}
                        </span>
                    </div>

                    {user?.workspaceMembers && user.workspaceMembers.length > 1 && (
                        <select
                            className="bg-transparent text-zinc-500 dark:text-zinc-400 text-sm ml-2 p-1 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded outline-none"
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

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto pt-6 pb-4 px-3 space-y-8 scrollbar-hide">
                    {Object.entries(groupedItems).map(([section, items]) => (
                        <div key={section} className="space-y-2">
                            <p className="px-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase">
                                {section}
                            </p>
                            <nav className="space-y-1">
                                {items.map((item) => (
                                    <NavItem
                                        key={item.href}
                                        item={item}
                                        onClick={() => setMobileMenuOpen(false)}
                                    />
                                ))}
                            </nav>
                        </div>
                    ))}
                </div>

            </div>

            {/* Mobile Backdrop */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </>
    );
}

