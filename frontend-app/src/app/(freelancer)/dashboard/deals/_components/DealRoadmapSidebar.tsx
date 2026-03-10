'use client';

import React, { useState } from 'react';
import { CheckCircle2, Lock, Eye, Play, StickyNote } from 'lucide-react';
import { DealStep } from './DealBuilder';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
    deal: any;
    activeStep: DealStep;
    onStepChange: (step: DealStep) => void;
    updateDeal?: (dealId: string, partial: any) => Promise<any>;
}

export function DealRoadmapSidebar({ deal, activeStep, onStepChange, updateDeal }: SidebarProps) {
    const isWon = deal?.status === 'WON';
    const currentStep = (deal?.currentStep as DealStep) || 'brief';
    const [notes, setNotes] = useState(deal?.notes || '');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    const indexMap: Record<DealStep, number> = { brief: 0, quotation: 1, payment_plan: 2, won: 3 };

    const isPast = (step: DealStep) => {
        if (isWon) return true;
        return indexMap[step] < indexMap[currentStep];
    };

    const isCurrent = (step: DealStep) => step === activeStep;

    const isLocked = (step: DealStep) => {
        if (isWon) return false;
        return indexMap[step] > indexMap[currentStep];
    };

    // Derive totals from real data
    const approvedQuotation = deal?.quotations?.find((q: any) => q.isApproved);
    const anyQuotation = deal?.quotations?.[0];
    const quotationTotal = approvedQuotation?.total ?? anyQuotation?.total ?? null;
    const hasQuotationItems = (approvedQuotation?.items ?? anyQuotation?.items ?? []).length > 0;
    const briefTemplate = deal?.brief?.template;

    const steps = [
        {
            id: 'brief' as DealStep,
            label: 'Cuestionario Brief',
            desc: briefTemplate
                ? `Plantilla: ${briefTemplate.name}`
                : deal?.brief?.isCompleted
                    ? 'Brief completado'
                    : 'Pendiente de asignar',
            amount: null,
        },
        {
            id: 'quotation' as DealStep,
            label: 'Configurar Cotización',
            desc: approvedQuotation
                ? `${approvedQuotation.optionName} aprobada`
                : hasQuotationItems
                    ? `${anyQuotation?.items?.length ?? 0} ítem(s) configurado(s)`
                    : 'Sin ítems aún',
            amount: quotationTotal ? `${Number(quotationTotal).toLocaleString('es-GT', { style: 'currency', currency: deal?.currency?.code || 'USD' })}` : null,
        },
        {
            id: 'payment_plan' as DealStep,
            label: 'Plan de Pagos',
            desc: deal?.paymentPlan
                ? `${deal.paymentPlan.milestones?.length ?? 0} hito(s) definido(s)`
                : 'Pendiente de configurar',
            amount: null,
        },
    ];

    return (
        <div className={cn(
            'h-full flex flex-col p-6 transition-colors duration-500',
            isWon ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : ''
        )}>
            {/* Header */}
            <div className="mb-8">
                <span className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                    Roadmap del Trato
                </span>
                <h2 className="text-xl font-bold mt-1 text-zinc-900 dark:text-white truncate" title={deal?.name}>
                    {deal?.name || 'Propuesta'}
                </h2>
                {deal?.client?.name && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                        Cliente: {deal.client.name}
                    </p>
                )}
                {isWon && (
                    <span className="inline-flex mt-2 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                        Ganado (WON)
                    </span>
                )}
            </div>

            {/* Steps Vertical Timeline */}
            <div className="flex-1 space-y-6 relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                {steps.map((step) => {
                    const active = isCurrent(step.id);
                    const past = isPast(step.id);
                    const locked = isLocked(step.id);

                    return (
                        <div key={step.id} className="relative flex items-start gap-4">
                            {/* Icon Indicator */}
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

                            {/* Content */}
                            <div className="flex flex-col flex-1 min-w-0">
                                <button
                                    onClick={() => !locked && onStepChange(step.id)}
                                    disabled={locked}
                                    className={cn(
                                        'text-left group outline-none',
                                        locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className={cn(
                                            'text-sm font-semibold mb-0.5 transition-colors',
                                            active ? 'text-primary' : 'text-zinc-700 dark:text-zinc-300',
                                            !active && !locked && 'group-hover:text-primary/70'
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

                                {/* Snapshot quick view for past steps */}
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

            {/* WON action */}
            {isWon && (
                <div className="mt-auto pt-6 border-t border-emerald-200 dark:border-emerald-800/50">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-3 text-center">
                        La fase de venta ha terminado. El proyecto está listo para ejecutarse.
                    </p>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-transform active:scale-95">
                        <Play className="w-4 h-4 mr-2" />
                        Ir al Espacio del Proyecto
                    </Button>
                </div>
            )}

            {/* Fix 2.8 — Internal Notes */}
            <div className={cn(
                'mt-6 pt-5 border-t',
                isWon ? 'border-emerald-200 dark:border-emerald-800/50' : 'border-zinc-200 dark:border-zinc-800'
            )}>
                <label className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    <StickyNote className="w-3.5 h-3.5" /> Notas internas
                </label>
                <textarea
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-zinc-400 dark:text-zinc-300"
                    rows={3}
                    placeholder="Apuntes privados, contexto del cliente..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    onBlur={async () => {
                        if (!updateDeal || notes === (deal?.notes || '')) return;
                        setIsSavingNotes(true);
                        await updateDeal(deal.slug || deal.id, { notes });
                        setIsSavingNotes(false);
                    }}
                />
                {isSavingNotes && <p className="text-[10px] text-zinc-400 mt-1">Guardando...</p>}
            </div>
        </div>
    );
}
