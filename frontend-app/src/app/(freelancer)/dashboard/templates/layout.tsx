'use client';

import { NavItem } from '@/components/layout/NavItem';
import {
    FileText,
    Calculator,
    PenTool
} from 'lucide-react';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
    const { t } = useWorkspaceSettings();

    const templateNavItems = [
        {
            title: 'FORMATOS',
            items: [
                { href: '/dashboard/templates/briefs', label: t('templates.briefs'), icon: PenTool },
                { href: '#quotes', label: t('templates.quotes'), icon: Calculator },
                { href: '#contracts', label: t('templates.contracts'), icon: FileText },
            ]
        }
    ];

    return (
        <div className="flex flex-col md:flex-row min-h-full bg-[#FDFDFD] dark:bg-[#0A0A0A] text-zinc-900 dark:text-zinc-100 w-full relative">

            {/* Secondary Sidebar */}
            <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 shrink-0 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl">
                <div className="h-full px-4 py-8 overflow-y-auto">
                    <div className="mb-8 px-2">
                        <h2 className="text-xl font-semibold tracking-tight">{t('templates.title')}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t('templates.desc')}
                        </p>
                    </div>

                    <nav className="space-y-8">
                        {templateNavItems.map((group) => (
                            <div key={group.title} className="space-y-1">
                                <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-3 mb-3">
                                    {group.title}
                                </h3>

                                <div className="space-y-1">
                                    {group.items.map((item) => (
                                        <NavItem key={item.href} item={item} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Content Area */}
            <div className="flex-1 w-full relative">
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/50 to-transparent dark:from-zinc-900/10 pointer-events-none" />
                <div className="relative z-10 w-full h-full">
                    {children}
                </div>
            </div>

        </div>
    );
}
