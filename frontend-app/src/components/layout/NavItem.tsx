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
                    ? 'bg-white dark:bg-gray-800 shadow-sm text-indigo-600 dark:text-indigo-400 font-medium'
                    : 'text-gray-500 dark:text-gray-400 font-medium hover:bg-white/60 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-100'
            )}
        >
            <item.icon
                className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive
                        ? 'text-indigo-500 dark:text-indigo-400'
                        : 'text-gray-400 dark:text-gray-500'
                )}
                aria-hidden="true"
            />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-indigo-500 text-white rounded-full text-xs px-2 py-0.5 leading-none font-medium">
                    {item.badge > 99 ? '99+' : item.badge}
                </span>
            )}
        </Link>
    );
}
