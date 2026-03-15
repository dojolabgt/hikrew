'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    FolderKanban,
    Settings,
    LayoutGrid,
    X,
    LogOut,
} from 'lucide-react';
import { NavItemConfig } from './NavItem';
import { cn, getImageUrl } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MobileBottomNavProps {
    navItems: NavItemConfig[];
}

const BOTTOM_ITEMS = [
    { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: '/dashboard/deals', label: 'Deals', icon: FileText },
    null, // center menu button
    { href: '/dashboard/projects', label: 'Proyectos', icon: FolderKanban },
    { href: '/dashboard/settings/personal-info', label: 'Ajustes', icon: Settings },
] as const;

export function MobileBottomNav({ navItems }: MobileBottomNavProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const userFullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Usuario';
    const userInitial = (user?.firstName?.[0] || user?.email?.[0] || '?').toUpperCase();

    const groupedItems = navItems.reduce((acc, item) => {
        const section = item.section || 'Navegación';
        if (!acc[section]) acc[section] = [];
        acc[section].push(item);
        return acc;
    }, {} as Record<string, NavItemConfig[]>);

    function isActive(href: string) {
        return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
    }

    return (
        <>
            {/* ── Bottom Nav Bar ── */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
                <div className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-800/60 px-1">
                    <div className="flex items-end justify-around h-16 max-w-sm mx-auto">
                        {BOTTOM_ITEMS.map((item, i) => {
                            if (item === null) {
                                return (
                                    <button
                                        key="menu"
                                        onClick={() => setSheetOpen(true)}
                                        className="relative -translate-y-4 flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 dark:bg-zinc-100 shadow-lg shadow-zinc-900/25 active:scale-95 transition-all duration-150"
                                        aria-label="Abrir menú"
                                    >
                                        <LayoutGrid className="h-5 w-5 text-white dark:text-zinc-900" />
                                    </button>
                                );
                            }

                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-1 px-3 py-2 flex-1 transition-colors",
                                        active
                                            ? "text-zinc-900 dark:text-white"
                                            : "text-zinc-400 dark:text-zinc-600"
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            "h-5 w-5 transition-all",
                                            active ? "stroke-[2.5px]" : "stroke-[1.5px]"
                                        )}
                                    />
                                    <span className={cn(
                                        "text-[10px] leading-none",
                                        active ? "font-bold" : "font-medium"
                                    )}>
                                        {item.label}
                                    </span>
                                    {active && (
                                        <span className="absolute bottom-0 w-1 h-1 rounded-full bg-zinc-900 dark:bg-white" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>

            {/* ── Backdrop ── */}
            <div
                className={cn(
                    "fixed inset-0 z-[60] md:hidden bg-zinc-900/50 backdrop-blur-sm",
                    "transition-opacity duration-300",
                    sheetOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setSheetOpen(false)}
            />

            {/* ── Bottom Sheet ── */}
            <div className={cn(
                "fixed bottom-0 left-0 right-0 z-[70] md:hidden",
                "bg-white dark:bg-zinc-950 rounded-t-3xl",
                "flex flex-col max-h-[88vh]",
                "transform transition-transform duration-300 ease-out",
                sheetOpen ? "translate-y-0" : "translate-y-full"
            )}>
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-2 shrink-0">
                    <div className="w-9 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                </div>

                {/* Sheet header */}
                <div className="flex items-center justify-between px-5 pb-3 shrink-0">
                    <span className="text-base font-semibold text-zinc-900 dark:text-white">Menú</span>
                    <button
                        onClick={() => setSheetOpen(false)}
                        className="p-1.5 -mr-1 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Nav items */}
                <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-5">
                    {Object.entries(groupedItems).map(([section, items]) => (
                        <div key={section}>
                            <p className="px-3 mb-1.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase">
                                {section}
                            </p>
                            <div className="space-y-0.5">
                                {items.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setSheetOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors",
                                                active
                                                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold"
                                                    : "text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                            )}
                                        >
                                            <item.icon className={cn(
                                                "h-[18px] w-[18px] shrink-0",
                                                active ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"
                                            )} />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* User footer */}
                <div className="shrink-0 border-t border-zinc-100 dark:border-zinc-800/60 px-4 py-4 pb-8">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-zinc-200 dark:border-zinc-700 shrink-0">
                            <AvatarImage src={getImageUrl(user?.profileImage)} alt={userFullName} className="object-cover" />
                            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold text-xs uppercase">
                                {userInitial}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                                {userFullName}
                            </p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate leading-tight">
                                {user?.email}
                            </p>
                        </div>
                        <button
                            onClick={() => { logout(); setSheetOpen(false); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 transition-colors shrink-0"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            Salir
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
