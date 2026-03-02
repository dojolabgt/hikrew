'use client';

import { TopHeader } from './Header';

/**
 * DashboardShell wraps the main content area for the internal dashboard views.
 * It provides the off-white background and comfortable padding as requested.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-[#FDFDFD] dark:bg-[#0A0A0A] text-zinc-900 dark:text-zinc-100 w-full min-h-full flex flex-col">
            <div className="flex-1 w-full px-6 py-6">
                {children}
            </div>
        </div>
    );
}

/**
 * Surface element for standard white cards/containers inside the Dashboard shell.
 * It replaces standard borders with soft shadows to maintain the clean look.
 */
export function Surface({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`bg-white dark:bg-[#121212] rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800/80 p-8 ${className}`}>
            {children}
        </div>
    );
}
