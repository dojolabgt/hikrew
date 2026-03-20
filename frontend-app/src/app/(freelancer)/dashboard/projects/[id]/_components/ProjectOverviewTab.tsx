'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    FileText, Mail, MessageCircle, User, Share2,
    CreditCard, ExternalLink, CheckCircle2, Circle, LayoutTemplate,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';
import { ProjectData, getProjectClientName, getProjectValue } from '../layout';
import { cn } from '@/lib/utils';

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    accent,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    sub?: string;
    accent?: 'emerald' | 'amber' | 'violet';
}) {
    const colors = {
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400',
        amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400',
        violet: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/40 text-violet-600 dark:text-violet-400',
    };
    const iconBg = {
        emerald: 'bg-emerald-100 dark:bg-emerald-900/40',
        amber: 'bg-amber-100 dark:bg-amber-900/40',
        violet: 'bg-violet-100 dark:bg-violet-900/40',
    };

    return (
        <div className={cn('rounded-xl border p-4 flex items-center gap-3', accent ? colors[accent] : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950')}>
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', accent ? iconBg[accent] : 'bg-zinc-100 dark:bg-zinc-800')}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">{label}</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{value}</p>
                {sub && <p className="text-[11px] text-zinc-400 truncate">{sub}</p>}
            </div>
        </div>
    );
}

export function ProjectOverviewTab({ project }: { project: ProjectData }) {
    const { activeWorkspace } = useAuth();
    const { t } = useWorkspaceSettings();

    const deal = project.deal;
    const clientName = getProjectClientName(project, '—');

    // Currency resolution
    const getCurrencySymbol = () => {
        const currCode = deal?.currency?.code ?? project.currency;
        if (deal?.currency?.symbol) return deal.currency.symbol;
        if (currCode && activeWorkspace?.currencies) {
            const found = activeWorkspace.currencies.find(
                (c: { code: string; symbol: string }) => c.code === currCode,
            );
            if (found) return found.symbol;
        }
        const fallbacks: Record<string, string> = {
            GTQ: 'Q', USD: '$', EUR: '€', MXN: '$', GBP: '£',
            CAD: '$', AUD: '$', CHF: 'Fr', BRL: 'R$',
        };
        return fallbacks[currCode ?? ''] ?? '$';
    };

    const sym = getCurrencySymbol();
    const currCode = deal?.currency?.code ?? project.currency ?? '';
    const valueStr = getProjectValue(project, sym);
    const quotation = deal?.quotations?.find((q) => q.isApproved) ?? deal?.quotations?.[0];

    // Stats computation
    const milestones = project.directPaymentPlan?.milestones ?? project.deal?.paymentPlan?.milestones ?? [];
    const paidCount = milestones.filter((m) => m.status === 'PAID').length;
    const pendingCount = milestones.filter((m) => m.status === 'PENDING' || m.status === 'OVERDUE').length;

    const projectBriefs = project.briefs ?? [];
    const completedBriefs = projectBriefs.filter((b) => b.isCompleted).length;

    const portalUrl = (() => {
        if (!deal?.publicToken) return null;
        const base = process.env.NEXT_PUBLIC_FRONTEND_PUBLIC_URL ||
            (typeof window !== 'undefined'
                ? `${window.location.protocol}//${window.location.hostname.replace('app.', 'client.')}${window.location.port === '3000' ? ':3001' : ''}`
                : '');
        return `${base}/d/${deal.publicToken}`;
    })();

    return (
        <div className="space-y-5">

            {/* ── At a glance stats row ─────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Client */}
                <StatCard
                    icon={User}
                    label={t('overview.clientTitle')}
                    value={clientName !== '—' ? clientName : t('overview.noClientAssigned')}
                    sub={deal?.client?.email ?? project.client?.email}
                    accent={clientName !== '—' ? undefined : undefined}
                />

                {/* Payments */}
                <StatCard
                    icon={CreditCard}
                    label={t('projects.tabPayments')}
                    value={
                        milestones.length === 0
                            ? t('overview.statsNoPlan')
                            : `${paidCount}/${milestones.length} ${t('overview.statsPaid')}`
                    }
                    sub={pendingCount > 0 ? `${pendingCount} ${t('overview.statsPending')}` : undefined}
                    accent={pendingCount > 0 ? 'amber' : milestones.length > 0 ? 'emerald' : undefined}
                />

                {/* Briefs */}
                <StatCard
                    icon={LayoutTemplate}
                    label={t('assets.briefsTitle')}
                    value={
                        projectBriefs.length === 0
                            ? t('overview.statsNoBriefs')
                            : `${completedBriefs}/${projectBriefs.length} ${t('overview.statsComplete')}`
                    }
                    sub={projectBriefs.length > 0 && completedBriefs < projectBriefs.length
                        ? `${projectBriefs.length - completedBriefs} ${t('overview.statsPending')}`
                        : undefined}
                    accent={
                        projectBriefs.length === 0
                            ? undefined
                            : completedBriefs < projectBriefs.length
                            ? 'violet'
                            : 'emerald'
                    }
                />
            </div>

            {/* ── Main content grid ─────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── Left: Context / Description ──────────────── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Description / Context */}
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                {t('overview.contextTitle')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5">
                            {project.description ? (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                    {project.description}
                                </p>
                            ) : deal?.proposalIntro ? (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                    {deal.proposalIntro}
                                </p>
                            ) : (
                                <p className="text-sm text-zinc-400 italic">
                                    {t('overview.noDescription')}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quotation summary (deal-based only) */}
                    {quotation && (
                        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        {t('overview.quotationTitle')}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        {quotation.isApproved && (
                                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-xs">
                                                {t('overview.quotationApproved')}
                                            </Badge>
                                        )}
                                        {portalUrl && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => window.open(portalUrl, '_blank')}
                                            >
                                                <Share2 className="w-3 h-3 mr-1" />
                                                {t('overview.viewPublic')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {quotation.optionName && (
                                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100 mb-3">
                                        {quotation.optionName}
                                    </p>
                                )}
                                {(quotation.items?.length ?? 0) > 0 && (
                                    <div className="space-y-1.5 mb-4 max-h-40 overflow-y-auto pr-1">
                                        {quotation.items?.map(
                                            (item: { name: string; quantity: string | number; price: string | number }, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="flex justify-between items-center text-sm py-1.5 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
                                                >
                                                    <span className="text-zinc-700 dark:text-zinc-300 text-[13px]">
                                                        {item.name}
                                                        <span className="text-xs text-zinc-400 ml-1.5">×{item.quantity}</span>
                                                    </span>
                                                    <span className="font-semibold text-zinc-900 dark:text-white text-[13px]">
                                                        {sym}{Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                    <span className="text-sm font-medium text-zinc-500">Total</span>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-zinc-900 dark:text-white">
                                            {sym}{Number(quotation.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                        {currCode && <span className="text-[10px] text-zinc-400 ml-1">{currCode}</span>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Standalone budget (no deal) */}
                    {!deal && project.budget && (
                        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <CardContent className="pt-5">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-zinc-500 font-medium">{t('overview.budgetLabel')}</p>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">{valueStr}</p>
                                        {currCode && <p className="text-xs text-zinc-400">{currCode}</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* ── Right: Client info ───────────────────────── */}
                <div className="space-y-5">
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                {t('overview.clientTitle')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            {clientName !== '—' ? (
                                <>
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{clientName}</p>
                                    {(deal?.client?.email ?? project.client?.email) && (
                                        <a
                                            href={`mailto:${deal?.client?.email ?? project.client?.email}`}
                                            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-primary transition-colors"
                                        >
                                            <Mail className="w-4 h-4 shrink-0" />
                                            {deal?.client?.email ?? project.client?.email}
                                        </a>
                                    )}
                                    {deal?.client?.whatsapp && (
                                        <a
                                            href={`https://wa.me/${deal.client.whatsapp}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-primary transition-colors"
                                        >
                                            <MessageCircle className="w-4 h-4 shrink-0" />
                                            {deal.client.whatsapp}
                                        </a>
                                    )}
                                    {portalUrl && (
                                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                            <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wide">
                                                {t('overview.portalLink')}
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs gap-1.5"
                                                onClick={() => window.open(portalUrl, '_blank')}
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                {t('overview.openPortal')}
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="py-4 text-center">
                                    <User className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                                    <p className="text-sm text-zinc-400 italic">{t('overview.noClientAssigned')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Briefs quick status */}
                    {projectBriefs.length > 0 && (
                        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <LayoutTemplate className="w-4 h-4 text-primary" />
                                    {t('assets.briefsTitle')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-3">
                                <div className="space-y-2">
                                    {projectBriefs.slice(0, 4).map((b) => (
                                        <div key={b.id} className="flex items-center gap-2 text-sm">
                                            {b.isCompleted
                                                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                : <Circle className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                                            }
                                            <span className={cn('truncate text-[13px]', b.isCompleted ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-800 dark:text-zinc-200')}>
                                                {b.name}
                                            </span>
                                        </div>
                                    ))}
                                    {projectBriefs.length > 4 && (
                                        <Link
                                            href={`/dashboard/projects/${project.id}/assets`}
                                            className="text-[11px] text-zinc-400 hover:text-primary transition-colors"
                                        >
                                            +{projectBriefs.length - 4} more
                                        </Link>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
