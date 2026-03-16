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
                <div className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-gray-200/60 dark:border-zinc-800/50">
                    <div className="flex items-end justify-around h-16 max-w-md mx-auto px-2">
                        {BOTTOM_ITEMS.map((item) => {
                            if (item === null) {
                                return (
                                    <button
                                        key="menu"
                                        onClick={() => setSheetOpen(true)}
                                        className="relative -translate-y-5 flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-900 dark:bg-zinc-100 shadow-lg shadow-black/15 dark:shadow-white/10 active:scale-95 transition-transform duration-150"
                                        aria-label="Abrir menú"
                                    >
                                        <LayoutGrid className="h-5 w-5 text-white dark:text-zinc-900" strokeWidth={2} />
                                    </button>
                                );
                            }

                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="relative flex flex-col items-center justify-center gap-1 py-2 flex-1 transition-all duration-200"
                                >
                                    {/* Active pill indicator */}
                                    <span className={cn(
                                        'absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-200',
                                        active ? 'w-5 bg-gray-800 dark:bg-zinc-300' : 'w-0 bg-transparent'
                                    )} />

                                    <item.icon className={cn(
                                        'h-[22px] w-[22px] transition-all duration-200',
                                        active
                                            ? 'text-gray-900 dark:text-zinc-100 stroke-[2.5px]'
                                            : 'text-gray-400 dark:text-zinc-500 stroke-[1.5px]'
                                    )} />
                                    <span className={cn(
                                        'text-[10px] leading-none transition-colors',
                                        active
                                            ? 'font-bold text-gray-900 dark:text-zinc-100'
                                            : 'font-medium text-gray-400 dark:text-zinc-500'
                                    )}>
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>

            {/* ── Backdrop ── */}
            <div
                className={cn(
                    'fixed inset-0 z-[60] md:hidden bg-black/30 backdrop-blur-sm',
                    'transition-opacity duration-300',
                    sheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )}
                onClick={() => setSheetOpen(false)}
            />

            {/* ── Bottom Sheet ── */}
            <div className={cn(
                'fixed bottom-0 left-0 right-0 z-[70] md:hidden',
                'bg-gradient-to-b from-gray-50 to-gray-100/80 dark:from-zinc-900 dark:to-zinc-950',
                'rounded-t-[28px]',
                'flex flex-col max-h-[88vh]',
                'transform transition-transform duration-300 ease-out',
                sheetOpen ? 'translate-y-0' : 'translate-y-full'
            )}>
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-[3px] rounded-full bg-gray-200 dark:bg-zinc-700" />
                </div>

                {/* Sheet header */}
                <div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
                    <div>
                        <span className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight">Menú</span>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Hi Krew</p>
                    </div>
                    <button
                        onClick={() => setSheetOpen(false)}
                        className="p-2 rounded-xl text-gray-500 bg-white/70 hover:bg-white dark:text-zinc-400 dark:bg-white/5 dark:hover:bg-white/10 transition-all duration-200 shadow-sm"
                        aria-label="Cerrar"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Nav items */}
                <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-4">
                    {Object.entries(groupedItems).map(([section, items]) => (
                        <div key={section}>
                            <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest text-gray-400/80 dark:text-zinc-500 uppercase select-none">
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
                                                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] transition-all duration-200',
                                                active
                                                    ? 'bg-white dark:bg-zinc-800 shadow-sm text-gray-900 dark:text-white font-medium'
                                                    : 'text-gray-400 dark:text-zinc-500 font-medium hover:bg-white/70 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-zinc-300'
                                            )}
                                        >
                                            <item.icon className={cn(
                                                'h-[18px] w-[18px] shrink-0',
                                                active
                                                    ? 'text-gray-700 dark:text-zinc-200'
                                                    : 'text-gray-400 dark:text-zinc-500'
                                            )} />
                                            <span className="flex-1">{item.label}</span>
                                            {item.badge !== undefined && item.badge > 0 && (
                                                <span className="bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 rounded-full text-[10px] px-2 py-0.5 leading-none font-semibold">
                                                    {item.badge > 99 ? '99+' : item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* User footer */}
                <div className="shrink-0 border-t border-gray-200/60 dark:border-zinc-800/50 px-4 pt-3 pb-10">
                    <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/60 dark:bg-white/5">
                        <Avatar className="h-9 w-9 ring-1 ring-gray-200 dark:ring-zinc-700 shrink-0">
                            <AvatarImage src={getImageUrl(user?.profileImage)} alt={userFullName} className="object-cover" />
                            <AvatarFallback className="bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 font-bold text-sm uppercase">
                                {userInitial}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 dark:text-zinc-100 truncate leading-tight">
                                {userFullName}
                            </p>
                            <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate leading-tight">
                                {user?.email}
                            </p>
                        </div>
                        <button
                            onClick={() => { logout(); setSheetOpen(false); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-400 transition-all duration-200 shrink-0"
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
