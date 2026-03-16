'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface NavItemConfig {
    href: string;
    label: string;
    icon: LucideIcon;
    section?: string;
    badge?: number;
}

interface NavItemProps {
    item: NavItemConfig;
    isMobile?: boolean;
    onClick?: () => void;
}

export function NavItem({ item, onClick }: NavItemProps) {
    const pathname = usePathname();
    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

    return (
        <Link
            href={item.href}
            onClick={onClick}
            className={cn(
                'flex items-center gap-2.5 py-2 px-3 text-sm rounded-xl transition-all duration-200',
                isActive
                    ? 'bg-white dark:bg-zinc-800 shadow-sm text-gray-900 dark:text-white font-medium'
                    : 'text-gray-400 dark:text-zinc-500 font-medium hover:bg-white/70 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-zinc-300'
            )}
        >
            <item.icon
                className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive
                        ? 'text-gray-700 dark:text-zinc-200'
                        : 'text-gray-400 dark:text-zinc-500'
                )}
                aria-hidden="true"
            />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 rounded-full text-[10px] px-2 py-0.5 leading-none font-semibold">
                    {item.badge > 99 ? '99+' : item.badge}
                </span>
            )}
        </Link>
    );
}
