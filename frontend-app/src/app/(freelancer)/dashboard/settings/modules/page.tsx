'use client';

import { useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ModuleCard, WorkspacePlan } from './_components/ModuleCard';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Puzzle, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';

// ─── Component ────────────────────────────────────────────────────────────────

export default function ModulesPage() {
    const { t } = useWorkspaceSettings();
    const { activeWorkspace } = useAuth();
    const userPlan = (activeWorkspace?.plan ?? 'free') as WorkspacePlan;

    // ─── Module definitions ───────────────────────────────────────────────────────

    const MODULES = [
        {
            id: 'audiovisual',
            icon: '🎬',
            name: t('modules.audiovisual.name'),
            tagline: t('modules.audiovisual.tagline'),
            description: t('modules.audiovisual.description'),
            features: [
                t('modules.audiovisual.feat1'),
                t('modules.audiovisual.feat2'),
                t('modules.audiovisual.feat3'),
                t('modules.audiovisual.feat4'),
            ],
            category: t('modules.audiovisual.category'),
            requiredPlan: 'pro' as const,
        },
        {
            id: 'photography',
            icon: '📸',
            name: t('modules.photography.name'),
            tagline: t('modules.photography.tagline'),
            description: t('modules.photography.description'),
            features: [
                t('modules.photography.feat1'),
                t('modules.photography.feat2'),
                t('modules.photography.feat3'),
                t('modules.photography.feat4'),
            ],
            category: t('modules.photography.category'),
            requiredPlan: 'pro' as const,
        },
        {
            id: 'webdev',
            icon: '💻',
            name: t('modules.webdev.name'),
            tagline: t('modules.webdev.tagline'),
            description: t('modules.webdev.description'),
            features: [
                t('modules.webdev.feat1'),
                t('modules.webdev.feat2'),
                t('modules.webdev.feat3'),
                t('modules.webdev.feat4'),
            ],
            category: t('modules.webdev.category'),
            requiredPlan: 'pro' as const,
        },
        {
            id: 'design',
            icon: '🎨',
            name: t('modules.design.name'),
            tagline: t('modules.design.tagline'),
            description: t('modules.design.description'),
            features: [
                t('modules.design.feat1'),
                t('modules.design.feat2'),
                t('modules.design.feat3'),
                t('modules.design.feat4'),
            ],
            category: t('modules.design.category'),
            requiredPlan: 'pro' as const,
        },
        {
            id: 'marketing',
            icon: '📣',
            name: t('modules.marketing.name'),
            tagline: t('modules.marketing.tagline'),
            description: t('modules.marketing.description'),
            features: [
                t('modules.marketing.feat1'),
                t('modules.marketing.feat2'),
                t('modules.marketing.feat3'),
                t('modules.marketing.feat4'),
            ],
            category: t('modules.marketing.category'),
            requiredPlan: 'premium' as const,
        },
        {
            id: 'consulting',
            icon: '📊',
            name: t('modules.consulting.name'),
            tagline: t('modules.consulting.tagline'),
            description: t('modules.consulting.description'),
            features: [
                t('modules.consulting.feat1'),
                t('modules.consulting.feat2'),
                t('modules.consulting.feat3'),
                t('modules.consulting.feat4'),
            ],
            category: t('modules.consulting.category'),
            requiredPlan: 'premium' as const,
        },
    ];


    // In the future this will come from workspace settings
    const [activeModuleIds, setActiveModuleIds] = useState<string[]>([]);

    const activeCount = activeModuleIds.length;

    const toggleModule = (id: string) => {
        setActiveModuleIds(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    // Plan descriptions
    const planInfo: Record<WorkspacePlan, { label: string; limit: string; color: string }> = {
        free: { label: 'Free', limit: t('modules.planFreeLimit'), color: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
        pro: { label: 'Pro', limit: t('modules.planProLimit'), color: 'bg-amber-100 text-amber-700 border-amber-200' },
        premium: { label: 'Premium', limit: t('modules.planPremiumLimit'), color: 'bg-violet-100 text-violet-700 border-violet-200' },
    };
    const { label, limit, color } = planInfo[userPlan];

    return (
        <DashboardShell>
            <div className="space-y-8 w-full py-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                            <Puzzle className="w-5 h-5 text-primary" />
                            {t('modules.title')}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t('modules.titleDesc')}
                        </p>
                    </div>

                    {/* Plan badge + usage */}
                    <div className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${color}`}>
                        <Crown className="w-3 h-3" />
                        {label} — {limit}
                    </div>
                </div>

                {/* Pro limit notice */}
                {userPlan === 'pro' && activeCount >= 1 && (
                    <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-400 flex items-center gap-2">
                        <Crown className="w-4 h-4 shrink-0" />
                        {t('modules.proLimitReachedPrefix')} <strong>{t('modules.proLimitReachedPremium')}</strong> {t('modules.proLimitReachedPostfix')}
                    </div>
                )}

                {/* Pro modules */}
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 block" />
                        {t('modules.proModules')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {MODULES.filter(m => m.requiredPlan === 'pro').map(module => (
                            <ModuleCard
                                key={module.id}
                                {...module}
                                isActive={activeModuleIds.includes(module.id)}
                                activeModulesCount={activeCount}
                                userPlan={userPlan}
                                onActivate={() => toggleModule(module.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Premium modules */}
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-400 block" />
                        {t('modules.premiumModules')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {MODULES.filter(m => m.requiredPlan === 'premium').map(module => (
                            <ModuleCard
                                key={module.id}
                                {...module}
                                isActive={activeModuleIds.includes(module.id)}
                                activeModulesCount={activeCount}
                                userPlan={userPlan}
                                onActivate={() => toggleModule(module.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
