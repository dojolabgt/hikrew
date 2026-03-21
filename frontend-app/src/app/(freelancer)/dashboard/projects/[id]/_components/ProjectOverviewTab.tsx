'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    FileText, Mail, MessageCircle, User, Share2,
    CreditCard, ExternalLink, CheckCircle2, Circle, LayoutTemplate,
    AlertCircle, Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';
import { ProjectData } from '../layout';
import { cn } from '@/lib/utils';
import { projectsApi } from '@/features/projects/api';

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
    const [clientUploads, setClientUploads] = useState(
        (project as unknown as { clientUploadsEnabled?: boolean }).clientUploadsEnabled ?? false,
    );
    const [savingUploads, setSavingUploads] = useState(false);

    const toggleClientUploads = async () => {
        if (!activeWorkspace) return;
        setSavingUploads(true);
        const next = !clientUploads;
        try {
            await projectsApi.update(activeWorkspace.id, project.id, { clientUploadsEnabled: next } as Parameters<typeof projectsApi.update>[2]);
            setClientUploads(next);
        } finally {
            setSavingUploads(false);
        }
    };

    const deal = project.deal;
    const clientEmail = deal?.client?.email ?? project.client?.email;
    const clientWhatsapp = deal?.client?.whatsapp;

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
    const quotation = deal?.quotations?.find((q) => q.isApproved) ?? deal?.quotations?.[0];

    // Stats
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

    const hasClientContact = clientEmail || clientWhatsapp || portalUrl;

    return (
        <div className="space-y-5">

            {/* ── Stats row: payments + briefs only ─────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        projectBriefs.length === 0 ? undefined
                        : completedBriefs < projectBriefs.length ? 'violet'
                        : 'emerald'
                    }
                />
            </div>

            {/* ── Main content grid ─────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── Left: Quotation / briefs checklist ────────── */}
                <div className="lg:col-span-2 space-y-5">

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
                                                    className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
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

                    {/* Briefs checklist */}
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
                                    {projectBriefs.slice(0, 5).map((b) => (
                                        <div key={b.id} className="flex items-center gap-2">
                                            {b.isCompleted
                                                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                : <Circle className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 shrink-0" />
                                            }
                                            <span className={cn('truncate text-[13px]', b.isCompleted ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-700 dark:text-zinc-200')}>
                                                {b.name}
                                            </span>
                                        </div>
                                    ))}
                                    {projectBriefs.length > 5 && (
                                        <Link
                                            href={`/dashboard/projects/${project.id}/assets`}
                                            className="text-[11px] text-zinc-400 hover:text-primary transition-colors pl-5"
                                        >
                                            +{projectBriefs.length - 5} {t('overview.moreBriefs')}
                                        </Link>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* ── Right: Client contact only ───────────────── */}
                <div className="space-y-5">
                    {hasClientContact ? (
                        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary" />
                                    {t('overview.clientContact')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-2.5">
                                {clientEmail && (
                                    <a
                                        href={`mailto:${clientEmail}`}
                                        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-primary transition-colors"
                                    >
                                        <Mail className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                                        <span className="truncate">{clientEmail}</span>
                                    </a>
                                )}
                                {clientWhatsapp && (
                                    <a
                                        href={`https://wa.me/${clientWhatsapp}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-primary transition-colors"
                                    >
                                        <MessageCircle className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                                        <span>{clientWhatsapp}</span>
                                    </a>
                                )}
                                {portalUrl && (
                                    <div className={cn((clientEmail || clientWhatsapp) && 'pt-2 border-t border-zinc-100 dark:border-zinc-800')}>
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
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex items-center gap-2 text-[12px] text-zinc-400 p-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {t('overview.noClientContact')}
                        </div>
                    )}

                    {/* Client uploads toggle */}
                    {portalUrl && (
                        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                                    <Upload className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">Carga de archivos del cliente</p>
                                    <p className="text-[11px] text-zinc-400 mt-0.5">
                                        {clientUploads
                                            ? 'El cliente puede subir archivos desde su portal'
                                            : 'Activa para permitir que el cliente suba archivos al proyecto'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={toggleClientUploads}
                                disabled={savingUploads}
                                className={cn(
                                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50',
                                    clientUploads ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700',
                                )}
                            >
                                <span className={cn(
                                    'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform',
                                    clientUploads ? 'translate-x-5' : 'translate-x-0',
                                )} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
