'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ChevronRight, Lock, Puzzle, Zap } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardFooter,
} from '@/components/ui/card';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';

// ─── Plan access levels ───────────────────────────────────────────────────────

export type WorkspacePlan = 'free' | 'pro' | 'premium';

export interface ModuleCardProps {
    icon: React.ReactNode;
    name: string;
    tagline: string;
    description: string;
    features: string[];          // bullet list of what the module adds
    category: string;            // e.g. "Audiovisual", "Fotografía"
    requiredPlan: 'pro' | 'premium'; // minimum plan to activate
    isActive?: boolean;
    activeModulesCount?: number; // how many the workspace has already activated
    userPlan: WorkspacePlan;
    onActivate?: () => void;
}

// ─── Plan badge helper ────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: 'pro' | 'premium' }) {
    if (plan === 'premium') {
        return (
            <Badge className="bg-violet-100/70 hover:bg-violet-100/70 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800/50 shadow-none text-[9px] font-bold px-1.5 py-0 uppercase tracking-widest leading-4">
                Premium
            </Badge>
        );
    }
    return (
        <Badge className="bg-amber-100/70 hover:bg-amber-100/70 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50 shadow-none text-[9px] font-bold px-1.5 py-0 uppercase tracking-widest leading-4">
            Pro
        </Badge>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ModuleCard({
    icon,
    name,
    tagline,
    description,
    features,
    category,
    requiredPlan,
    isActive = false,
    activeModulesCount = 0,
    userPlan,
    onActivate,
}: ModuleCardProps) {
    const { t } = useWorkspaceSettings();
    // Access logic
    const planRank: Record<WorkspacePlan, number> = { free: 0, pro: 1, premium: 2 };
    const requiredRank = planRank[requiredPlan];
    const userRank = planRank[userPlan];
    const hasRequiredPlan = userRank >= requiredRank;

    // Pro users can only activate 1 module total
    const proLimitReached = userPlan === 'pro' && !isActive && activeModulesCount >= 1;

    const isLocked = !hasRequiredPlan || proLimitReached;

    let ctaLabel = t('modules.activateModule');
    let lockReason = '';
    if (!hasRequiredPlan) {
        lockReason = requiredPlan === 'premium' ? t('modules.requiresPremium') : t('modules.requiresPro');
    } else if (proLimitReached) {
        lockReason = t('modules.proModulesLimit');
    }

    return (
        <Card
            className={`flex flex-col transition-all duration-300 ${isActive
                ? 'border-primary/40 bg-primary/[0.02] shadow-sm shadow-primary/10'
                : isLocked
                    ? 'opacity-75'
                    : 'hover:shadow-md hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl border shadow-sm transition-all ${isActive
                        ? 'bg-primary/10 border-primary/20'
                        : 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-100 dark:border-zinc-800'
                        } ${isLocked ? 'grayscale' : ''}`}>
                        {icon}
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                        <PlanBadge plan={requiredPlan} />
                        {isActive && (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/30 gap-1 text-[10px] font-medium px-2 py-0.5 shadow-none uppercase tracking-wider">
                                <Zap className="w-2.5 h-2.5" />
                                {t('modules.active')}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Category pill */}
                <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                    {category}
                </span>
            </CardHeader>

            <CardContent className="flex-1 pb-4 space-y-3">
                <div>
                    <h3 className="font-semibold text-base leading-tight tracking-tight">{name}</h3>
                    <p className="text-xs font-medium text-primary mt-0.5">{tagline}</p>
                </div>

                <CardDescription className="text-sm leading-relaxed">
                    {description}
                </CardDescription>

                {/* Feature list */}
                <ul className="space-y-1">
                    {features.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <Puzzle className="w-3 h-3 mt-0.5 shrink-0 text-primary/50" />
                            {f}
                        </li>
                    ))}
                </ul>
            </CardContent>

            <CardFooter className="pt-4 border-t border-border/50">
                {isLocked ? (
                    <Button
                        variant="secondary"
                        className="w-full gap-2 h-10 rounded-xl"
                        disabled
                    >
                        <Lock className="w-3.5 h-3.5" />
                        {lockReason}
                    </Button>
                ) : isActive ? (
                    <Button
                        variant="outline"
                        className="w-full gap-2 h-10 rounded-xl"
                        onClick={onActivate}
                    >
                        {t('modules.viewConfig')}
                        <ChevronRight className="w-4 h-4 ml-auto" />
                    </Button>
                ) : (
                    <PrimaryButton
                        className="w-full gap-2"
                        onClick={onActivate}
                    >
                        {ctaLabel}
                        <ChevronRight className="w-4 h-4 ml-auto" />
                    </PrimaryButton>
                )}
            </CardFooter>
        </Card>
    );
}
