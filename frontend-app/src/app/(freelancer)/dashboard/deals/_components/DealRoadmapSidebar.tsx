'use client';

import React from 'react';
import { CheckCircle2, Circle, Lock, ArrowRight, Eye, Edit2, Play } from 'lucide-react';
import { DealDataMock, DealStep } from './DealBuilder';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
    dealData: DealDataMock;
    activeStep: DealStep;
    onStepChange: (step: DealStep) => void;
}

export function DealRoadmapSidebar({ dealData, activeStep, onStepChange }: SidebarProps) {
    const isWon = dealData.status === 'won';

    // Helpers to determine step status
    const isPast = (step: DealStep) => {
        if (dealData.status === 'won') return true;
        const indexMap: Record<DealStep, number> = { 'brief': 0, 'quotation': 1, 'payment_plan': 2, 'won': 3 };
        return indexMap[step] < indexMap[dealData.currentStep];
    };

    const isCurrent = (step: DealStep) => step === activeStep;

    // Example: locked if previous steps aren't done (In reality, based on business logic)
    const isLocked = (step: DealStep) => {
        if (dealData.status === 'won') return false;
        const indexMap: Record<DealStep, number> = { 'brief': 0, 'quotation': 1, 'payment_plan': 2, 'won': 3 };
        return indexMap[step] > indexMap[dealData.currentStep] + 1; // Simplistic unlock
    };

    const steps = [
        {
            id: 'brief' as DealStep,
            label: 'Cuestionario Brief',
            desc: dealData.brief.completed ? 'Respondido hace 2 días' : 'Pendiente de enviar',
            amount: null,
            canEdit: dealData.status !== 'won',
        },
        {
            id: 'quotation' as DealStep,
            label: 'Configurar Cotización',
            desc: dealData.quotation.approved ? 'Opción B aprobada' : 'Seleccionando opciones',
            amount: dealData.quotation.total 
                ? `$${dealData.quotation.total.toLocaleString()} USD` 
                : (dealData.currentStep === 'brief' ? null : 'Calculando...'),
            canEdit: dealData.status !== 'won',
        },
        {
            id: 'payment_plan' as DealStep,
            label: 'Plan de Pagos',
            desc: dealData.paymentPlan.configured ? `${dealData.paymentPlan.milestonesCount} hitos definidos` : 'Pendiente de configurar',
            amount: null,
            canEdit: dealData.status !== 'won',
        }
    ];

    return (
        <div className={cn(
            "h-full flex flex-col p-6 transition-colors duration-500",
            isWon ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" : ""
        )}>
            {/* Header */}
            <div className="mb-8">
                <span className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                    Roadmap del Trato
                </span>
                <h2 className="text-xl font-bold mt-1 text-zinc-900 dark:text-white truncate" title={dealData.title}>
                    {dealData.title}
                </h2>
                {isWon && (
                    <span className="inline-flex mt-2 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                        Ganado (WON)
                    </span>
                )}
            </div>

            {/* Steps Vertical Timeline */}
            <div className="flex-1 space-y-6 relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                {steps.map((step, idx) => {
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
                                        "text-left group outline-none",
                                        locked ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className={cn(
                                            "text-sm font-semibold mb-0.5 transition-colors",
                                            active ? "text-primary" : "text-zinc-700 dark:text-zinc-300",
                                            !active && !locked && "group-hover:text-primary/70"
                                        )}>
                                            {step.label}
                                        </h3>
                                    </div>

                                    {/* Micro-summaries */}
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                        {step.desc}
                                    </p>
                                    {step.amount && (
                                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                                            {step.amount}
                                        </p>
                                    )}
                                </button>

                                {/* Quick Actions (if past step) */}
                                {past && !active && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded"
                                            onClick={() => onStepChange(step.id)}
                                        >
                                            <Eye className="w-3 h-3 mr-1" /> Snapshot
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* WON Transition state action */}
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
        </div>
    );
}
