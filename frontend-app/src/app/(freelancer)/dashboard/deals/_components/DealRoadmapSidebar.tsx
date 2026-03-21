'use client';

import React, { useState } from 'react';
import { CheckCircle2, Lock, Eye, Play, StickyNote, Send, Copy, RefreshCw, KeyRound, X } from 'lucide-react';
import { DealStep } from './DealBuilder';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { type DealStatus } from '@/hooks/use-deals';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_COLORS = {
    DRAFT:       { color: 'text-yellow-700 dark:text-yellow-400',  bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    SENT:        { color: 'text-blue-700 dark:text-blue-400',      bg: 'bg-blue-100 dark:bg-blue-900/30' },
    VIEWED:      { color: 'text-purple-700 dark:text-purple-400',  bg: 'bg-purple-100 dark:bg-purple-900/30' },
    NEGOTIATING: { color: 'text-orange-700 dark:text-orange-400',  bg: 'bg-orange-100 dark:bg-orange-900/30' },
    WON:         { color: 'text-emerald-700 dark:text-emerald-400',bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    LOST:        { color: 'text-rose-700 dark:text-rose-400',      bg: 'bg-rose-100 dark:bg-rose-900/30' },
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface DealData {
    id?: string;
    slug?: string;
    name?: string;
    status?: string;
    publicToken?: string;
    currentStep?: string;
    notes?: string;
    currency?: { symbol?: string };
    client?: { name?: string };
    brief?: {
        template?: { name?: string };
        isCompleted?: boolean;
        responses?: unknown;
        publicToken?: string;
    };
    quotations?: Array<{
        isApproved?: boolean;
        total?: number;
        currency?: string;
        optionName?: string;
        items?: unknown[];
    }>;
    paymentPlan?: { milestones?: unknown[]; id?: string };
    project?: { id?: string };
    collaborators?: Array<{ workspace: { id: string }; role: string }>;
    [key: string]: unknown;
}

interface SidebarProps {
    deal: DealData;
    activeStep: DealStep;
    onStepChange: (step: DealStep) => void;
    onStatusChange?: (status: DealStatus) => void;
    updateDeal?: (dealId: string, partial: Record<string, unknown>) => Promise<unknown>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DealRoadmapSidebar({ deal, activeStep, onStepChange, onStatusChange, updateDeal }: SidebarProps) {
    const { activeWorkspace } = useAuth();
    const { t } = useWorkspaceSettings();
    const router = useRouter();

    const isWon = deal?.status === 'WON';
    const isLost = deal?.status === 'LOST';
    const currentStep = (deal?.currentStep as DealStep) || 'brief';
    const [notes, setNotes] = useState(deal?.notes || '');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [sharePassword, setSharePassword] = useState((deal as Record<string, unknown>)?.clientAccessPassword as string || '');
    const [isSavingShare, setIsSavingShare] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const STATUS_OPTIONS: { value: DealStatus; label: string; color: string; bg: string }[] = [
        { value: 'DRAFT',       label: t('deals.statusDraft'),             ...STATUS_COLORS.DRAFT },
        { value: 'SENT',        label: t('deals.statusSent'),              ...STATUS_COLORS.SENT },
        { value: 'VIEWED',      label: t('deals.statusViewed'),            ...STATUS_COLORS.VIEWED },
        { value: 'NEGOTIATING', label: t('deals.statusNegotiatingFilter'), ...STATUS_COLORS.NEGOTIATING },
        { value: 'WON',         label: t('deals.statusWon'),               ...STATUS_COLORS.WON },
        { value: 'LOST',        label: t('deals.statusLost'),              ...STATUS_COLORS.LOST },
    ];

    const statusCfg = STATUS_OPTIONS.find((s) => s.value === (deal?.status || 'DRAFT')) ?? STATUS_OPTIONS[0];

    const indexMap: Record<DealStep, number> = { brief: 0, quotation: 1, payment_plan: 2, won: 3 };

    const isPast   = (step: DealStep) => isWon || indexMap[step] < indexMap[currentStep];
    const isCurrent = (step: DealStep) => step === activeStep;
    const isLocked  = (step: DealStep) => !isWon && indexMap[step] > indexMap[currentStep];

    // Totals
    const approvedQuotation = deal?.quotations?.find((q) => q.isApproved);
    const anyQuotation = deal?.quotations?.[0];
    const quotationTotal = approvedQuotation?.total ?? anyQuotation?.total ?? null;
    const hasQuotationItems = (approvedQuotation?.items ?? anyQuotation?.items ?? []).length > 0;
    const briefTemplate = deal?.brief?.template;

    let symbol = deal?.currency?.symbol || '$';
    const quotationCurrency = approvedQuotation?.currency || anyQuotation?.currency;
    if (quotationCurrency) {
        const found = activeWorkspace?.currencies?.find((c: { code: string; symbol: string }) => c.code === quotationCurrency);
        if (found) symbol = found.symbol;
        else {
            const fallbacks: Record<string, string> = {
                GTQ: 'Q', USD: '$', EUR: '€', MXN: '$', GBP: '£', JPY: '¥',
                CAD: '$', AUD: '$', CHF: 'Fr', CNY: '¥', BRL: 'R$',
            };
            symbol = fallbacks[quotationCurrency] || quotationCurrency;
        }
    }
    const formattedAmount = quotationTotal !== null
        ? `${symbol}${Number(quotationTotal).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`
        : null;

    const steps = [
        {
            id: 'brief' as DealStep,
            label: t('deals.briefStepLabel'),
            desc: briefTemplate
                ? `${t('deals.briefTemplateLabel')} ${briefTemplate.name}`
                : deal?.brief?.isCompleted ? t('deals.briefCompleted') : t('deals.briefPending'),
            amount: null,
        },
        {
            id: 'quotation' as DealStep,
            label: t('deals.quotationStepLabel'),
            desc: approvedQuotation
                ? `${approvedQuotation.optionName} ${t('deals.quotationApproved')}`
                : hasQuotationItems
                    ? `${anyQuotation?.items?.length ?? 0} ${t('deals.noItems').replace('Sin ', '').replace(' aún', '')}(s)`
                    : t('deals.noItems'),
            amount: formattedAmount,
        },
        {
            id: 'payment_plan' as DealStep,
            label: t('deals.paymentStepLabel'),
            desc: deal?.paymentPlan
                ? `${deal.paymentPlan.milestones?.length ?? 0} hito(s) definido(s)`
                : t('deals.paymentPending'),
            amount: null,
        },
    ];

    return (
        <div className={cn(
            'h-full flex flex-col p-6 transition-colors duration-500',
            isWon && 'bg-emerald-50/50 dark:bg-emerald-950/20',
            isLost && 'bg-rose-50/50 dark:bg-rose-950/20',
        )}>
            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="mb-8">
                <span className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                    {t('deals.roadmapTitle')}
                </span>
                <h2 className="text-xl font-bold mt-1 text-zinc-900 dark:text-white truncate" title={deal?.name}>
                    {deal?.name || t('deals.defaultName')}
                </h2>
                {deal?.client?.name && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                        {deal.client.name}
                    </p>
                )}

                {/* Status selector */}
                <div className="mt-3 relative">
                    <button
                        onClick={() => setStatusOpen((o) => !o)}
                        className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
                            statusCfg.bg,
                            statusCfg.color,
                            'hover:opacity-80',
                        )}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {statusCfg.label}
                        <span className="ml-0.5 opacity-60">▾</span>
                    </button>

                    {statusOpen && (
                        <>
                            {/* Backdrop */}
                            <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                            <div className="absolute left-0 top-full mt-1 z-20 w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
                                {STATUS_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            setStatusOpen(false);
                                            if (opt.value !== deal?.status) {
                                                onStatusChange?.(opt.value);
                                            }
                                        }}
                                        className={cn(
                                            'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left transition-colors',
                                            'hover:bg-zinc-50 dark:hover:bg-zinc-800',
                                            opt.value === deal?.status && 'bg-zinc-50 dark:bg-zinc-800',
                                        )}
                                    >
                                        <span className={cn('w-2 h-2 rounded-full', opt.bg)} />
                                        <span className={opt.color}>{opt.label}</span>
                                        {opt.value === deal?.status && (
                                            <span className="ml-auto text-zinc-400">✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Steps Timeline ────────────────────────────────────────── */}
            <div className="flex-1 space-y-6 relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                {steps.map((step) => {
                    const active = isCurrent(step.id);
                    const past   = isPast(step.id);
                    const locked = isLocked(step.id);

                    return (
                        <div key={step.id} className="relative flex items-start gap-4">
                            <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white dark:bg-zinc-950 mt-0.5">
                                {isWon ? (
                                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                ) : past ? (
                                    <CheckCircle2 className="h-6 w-6 text-zinc-700 dark:text-zinc-300" />
                                ) : active ? (
                                    <div className="h-4 w-4 rounded-full bg-primary ring-4 ring-primary/20 animate-pulse" />
                                ) : (
                                    <Lock className="h-4 w-4 text-zinc-400" />
                                )}
                            </div>

                            <div className="flex flex-col flex-1 min-w-0">
                                <button
                                    onClick={() => !locked && onStepChange(step.id)}
                                    disabled={locked}
                                    className={cn(
                                        'text-left group outline-none',
                                        locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className={cn(
                                            'text-sm font-semibold mb-0.5 transition-colors',
                                            active ? 'text-primary' : 'text-zinc-700 dark:text-zinc-300',
                                            !active && !locked && 'group-hover:text-primary/70',
                                        )}>
                                            {step.label}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{step.desc}</p>
                                    {step.amount && (
                                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                                            {step.amount}
                                        </p>
                                    )}
                                </button>

                                {past && !active && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded"
                                            onClick={() => onStepChange(step.id)}
                                        >
                                            <Eye className="w-3 h-3 mr-1" /> Ver
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Won CTA ───────────────────────────────────────────────── */}
            {isWon && deal?.project?.id && (
                <div className="mt-auto pt-6 border-t border-emerald-200 dark:border-emerald-800/50">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-3 text-center">
                        {t('deals.salePhaseEnded')}
                    </p>
                    <Button
                        onClick={() => router.push(`/dashboard/projects/${deal.project!.id}`)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-transform active:scale-95"
                    >
                        <Play className="w-4 h-4 mr-2" />
                        {t('deals.goToProject')}
                    </Button>
                </div>
            )}

            {/* ── Send to client ─────────────────────────────────────────── */}
            {deal?.publicToken && !isWon && (
                <div className={cn(
                    'mt-6 pt-5 border-t',
                    isLost ? 'border-rose-200 dark:border-rose-800/50' : 'border-zinc-200 dark:border-zinc-800',
                )}>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-xs"
                        onClick={() => setShareOpen(true)}
                    >
                        <Send className="w-3.5 h-3.5" />
                        Enviar a cliente
                    </Button>

                    {/* Share dialog (inline) */}
                    {shareOpen && (() => {
                        const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_PUBLIC_URL
                            || (typeof window !== 'undefined'
                                ? `${window.location.protocol}//${window.location.hostname.replace('app.', 'client.')}${window.location.port === '3000' ? ':3001' : ''}`
                                : '');
                        const shareUrl = sharePassword
                            ? `${baseUrl}/d/${deal.publicToken}?password=${encodeURIComponent(sharePassword)}`
                            : `${baseUrl}/d/${deal.publicToken}`;

                        const generatePassword = () => {
                            const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
                            setSharePassword(Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''));
                        };

                        const saveAndCopy = async () => {
                            if (!updateDeal) return;
                            setIsSavingShare(true);
                            await updateDeal((deal.slug || deal.id) as string, { clientAccessPassword: sharePassword || null });
                            setIsSavingShare(false);
                            navigator.clipboard.writeText(shareUrl);
                            setIsCopied(true);
                            setTimeout(() => { setIsCopied(false); setShareOpen(false); }, 2000);
                        };

                        return (
                            <div className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3 space-y-3">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Compartir propuesta
                                    </span>
                                    <button onClick={() => setShareOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Password row */}
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                                        <KeyRound className="w-3 h-3" /> Contraseña de acceso (opcional)
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="text"
                                            value={sharePassword}
                                            onChange={(e) => setSharePassword(e.target.value)}
                                            placeholder="Sin contraseña"
                                            className="flex-1 min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-zinc-300"
                                        />
                                        <button
                                            onClick={generatePassword}
                                            title="Generar contraseña"
                                            className="shrink-0 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </button>
                                        {sharePassword && (
                                            <button
                                                onClick={() => setSharePassword('')}
                                                title="Quitar contraseña"
                                                className="shrink-0 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Link preview */}
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-400 truncate select-all font-mono">
                                    {shareUrl}
                                </div>

                                {/* CTA */}
                                <Button
                                    size="sm"
                                    className="w-full gap-2 text-xs"
                                    disabled={isSavingShare}
                                    onClick={saveAndCopy}
                                >
                                    {isCopied
                                        ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copiado</>
                                        : isSavingShare
                                            ? 'Guardando...'
                                            : <><Copy className="w-3.5 h-3.5" /> Copiar link</>
                                    }
                                </Button>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* ── Internal Notes ────────────────────────────────────────── */}
            <div className={cn(
                'mt-6 pt-5 border-t',
                isWon ? 'border-emerald-200 dark:border-emerald-800/50'
                      : isLost ? 'border-rose-200 dark:border-rose-800/50'
                      : 'border-zinc-200 dark:border-zinc-800',
            )}>
                <label className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    <StickyNote className="w-3.5 h-3.5" /> {t('deals.internalNotes')}
                </label>
                <textarea
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-zinc-400 dark:text-zinc-300"
                    rows={3}
                    placeholder={t('deals.notesPlaceholder')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={async () => {
                        if (!updateDeal || notes === (deal?.notes || '')) return;
                        setIsSavingNotes(true);
                        await updateDeal((deal.slug || deal.id) as string, { notes });
                        setIsSavingNotes(false);
                    }}
                />
                {isSavingNotes && <p className="text-[10px] text-zinc-400 mt-1">{t('common.saving')}</p>}
            </div>
        </div>
    );
}
