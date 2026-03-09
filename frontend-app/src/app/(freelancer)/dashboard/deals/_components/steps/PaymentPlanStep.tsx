'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usePaymentPlan } from '@/hooks/use-payment-plan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PaymentPlanStepProps {
    dealId: string;
    quotations: any[];
    readonly?: boolean;
}

const MILESTONE_STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    PAID: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    OVERDUE: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
    CANCELLED: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500',
};
const MILESTONE_STATUS_LABELS: Record<string, string> = {
    PENDING: 'Pendiente',
    PAID: 'Pagado',
    OVERDUE: 'Vencido',
    CANCELLED: 'Cancelado',
};

interface NewMilestone {
    name: string;
    percentage: string;
    amount: string;
    dueDate: string;
    description: string;
}

const emptyMilestone = (): NewMilestone => ({
    name: '',
    percentage: '',
    amount: '',
    dueDate: '',
    description: '',
});

interface FieldErrors {
    name?: string;
    amount?: string;
    percentage?: string;
}

export function PaymentPlanStep({ dealId, quotations, readonly }: PaymentPlanStepProps) {
    const { paymentPlan, fetchPaymentPlan, createPaymentPlan, addMilestone, deleteMilestone, isLoading } = usePaymentPlan(dealId);
    const [milestones, setMilestones] = useState<NewMilestone[]>([emptyMilestone()]);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingToExisting, setIsAddingToExisting] = useState(false);
    const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors[]>([{}]);
    const [addExistingErrors, setAddExistingErrors] = useState<FieldErrors>({});
    const [submitError, setSubmitError] = useState<string>('');

    useEffect(() => {
        fetchPaymentPlan();
    }, [fetchPaymentPlan]);

    useEffect(() => {
        if (quotations.length > 0 && !selectedQuotationId) {
            const approved = quotations.find(q => q.isApproved);
            setSelectedQuotationId(approved?.id || quotations[0]?.id || '');
        }
    }, [quotations, selectedQuotationId]);

    const selectedQuotation = quotations.find(q => q.id === selectedQuotationId);
    const quotationTotal = selectedQuotation ? Number(selectedQuotation.total ?? 0) : null;
    const fmt = (n: number) => `$${n.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;

    // ── Auto-calc helpers ───────────────────────────────────────────────────

    const updateMilestone = useCallback((idx: number, field: keyof NewMilestone, value: string) => {
        setMilestones(prev => {
            const updated = [...prev];
            const m = { ...updated[idx], [field]: value };

            // Auto-calc: percentage → amount
            if (field === 'percentage' && quotationTotal && value !== '') {
                const pct = parseFloat(value);
                if (!isNaN(pct) && pct >= 0 && pct <= 100) {
                    m.amount = ((pct / 100) * quotationTotal).toFixed(2);
                }
            }

            // Auto-calc: amount → percentage
            if (field === 'amount' && quotationTotal && quotationTotal > 0 && value !== '') {
                const amt = parseFloat(value);
                if (!isNaN(amt) && amt >= 0) {
                    m.percentage = ((amt / quotationTotal) * 100).toFixed(1);
                }
            }

            updated[idx] = m;
            return updated;
        });

        // Clear field-level error on change
        setFieldErrors(prev => {
            const errs = [...prev];
            errs[idx] = { ...errs[idx], [field]: undefined };
            return errs;
        });
        setSubmitError('');
    }, [quotationTotal]);

    // ── Validation ──────────────────────────────────────────────────────────

    const validate = (): boolean => {
        const newErrors: FieldErrors[] = milestones.map(m => {
            const e: FieldErrors = {};
            if (!m.name.trim()) e.name = 'El nombre del hito es requerido.';
            if (!m.amount || Number(m.amount) <= 0) {
                e.amount = !m.amount
                    ? 'Ingresa el monto del hito.'
                    : 'El monto debe ser mayor a cero.';
            }
            if (m.percentage && (Number(m.percentage) < 0 || Number(m.percentage) > 100)) {
                e.percentage = 'El porcentaje debe estar entre 0 y 100.';
            }
            return e;
        });

        setFieldErrors(newErrors);
        const hasErrors = newErrors.some(e => Object.keys(e).length > 0);

        if (hasErrors) {
            const errorCount = newErrors.filter(e => Object.keys(e).length > 0).length;
            setSubmitError(
                errorCount === 1
                    ? 'Hay un hito con información incompleta. Revísalo antes de guardar.'
                    : `Hay ${errorCount} hitos con información incompleta. Revísalos antes de guardar.`
            );
        }

        // Check total vs quotation
        if (!hasErrors && quotationTotal) {
            const planTotal = milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0);
            const diff = Math.abs(planTotal - quotationTotal);
            if (diff > 0.01) {
                setSubmitError(
                    `El total del plan (${fmt(planTotal)}) no coincide con la cotización (${fmt(quotationTotal)}). Ajusta los montos o el porcentaje para que sumen correctamente.`
                );
                // Not blocking — warn only
            }
        }

        return !hasErrors;
    };

    // ── Handlers ────────────────────────────────────────────────────────────

    const handleCreatePlan = async () => {
        if (!validate()) return;

        setIsSaving(true);
        setSubmitError('');
        const result = await createPaymentPlan({
            quotationId: selectedQuotationId || undefined,
            milestones: milestones.map(m => ({
                name: m.name.trim(),
                amount: Number(m.amount),
                percentage: m.percentage ? Number(m.percentage) : undefined,
                description: m.description || undefined,
                dueDate: m.dueDate || undefined,
            })),
        });
        setIsSaving(false);
        if (result) {
            toast.success('Plan de cobro guardado exitosamente');
            setMilestones([emptyMilestone()]);
            setFieldErrors([{}]);
        } else {
            setSubmitError('Ocurrió un error al guardar el plan. Intenta de nuevo.');
        }
    };

    const handleAddMilestone = () => setMilestones(prev => [...prev, emptyMilestone()]);

    const handleRemoveMilestone = (idx: number) => {
        setMilestones(prev => prev.filter((_, i) => i !== idx));
        setFieldErrors(prev => prev.filter((_, i) => i !== idx));
    };

    const handleAddToExisting = async () => {
        const m = milestones[0];
        const errs: FieldErrors = {};
        if (!m.name.trim()) errs.name = 'Escribe el nombre del hito.';
        if (!m.amount || Number(m.amount) <= 0) {
            errs.amount = !m.amount ? 'Ingresa el monto del hito.' : 'El monto debe ser mayor a cero.';
        }
        if (m.percentage && (Number(m.percentage) < 0 || Number(m.percentage) > 100)) {
            errs.percentage = 'El porcentaje debe estar entre 0 y 100.';
        }
        setAddExistingErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setIsAddingToExisting(true);
        const result = await addMilestone({
            name: m.name.trim(),
            amount: Number(m.amount),
            percentage: m.percentage ? Number(m.percentage) : undefined,
            description: m.description || undefined,
            dueDate: m.dueDate || undefined,
        });
        setIsAddingToExisting(false);
        if (result) {
            toast.success('Hito agregado al plan');
            setMilestones([emptyMilestone()]);
            setAddExistingErrors({});
            // Refetch so the milestones list reflects the new entry
            await fetchPaymentPlan();
        } else {
            toast.error('No se pudo agregar el hito. Intenta de nuevo.');
        }
    };

    const handleDeleteMilestone = async (milestoneId: string) => {
        await deleteMilestone(milestoneId);
        toast.success('Hito eliminado');
    };

    // ── Summary calculations ─────────────────────────────────────────────────

    const planDraftTotal = milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0);
    const existingPlanTotal = paymentPlan?.milestones?.reduce((s: number, m: any) => s + Number(m.amount), 0) ?? 0;
    const hasQuotationMismatch = quotationTotal !== null && Math.abs(planDraftTotal - quotationTotal) > 0.01 && planDraftTotal > 0;

    // ── EXISTING PLAN VIEW ──────────────────────────────────────────────────

    if (paymentPlan) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-white">Plan de Cobro</h3>
                        <p className="text-sm text-zinc-500">
                            Total del plan:{' '}
                            <span className="font-semibold text-zinc-900 dark:text-white">
                                {fmt(paymentPlan.totalAmount)}
                            </span>
                        </p>
                    </div>
                    {quotationTotal && Math.abs(existingPlanTotal - quotationTotal) > 0.01 && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            El total del plan ({fmt(existingPlanTotal)}) difiere de la cotización ({fmt(quotationTotal)})
                        </div>
                    )}
                </div>

                {/* Milestones list */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        <div className="col-span-4">Hito</div>
                        <div className="col-span-2 text-center">%</div>
                        <div className="col-span-3 text-right">Monto</div>
                        <div className="col-span-2 text-center">Fecha</div>
                        <div className="col-span-1" />
                    </div>

                    {paymentPlan.milestones?.map((milestone: any) => (
                        <div
                            key={milestone.id}
                            className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20"
                        >
                            <div className="col-span-4">
                                <div className="font-medium text-sm text-zinc-900 dark:text-white">{milestone.name}</div>
                                {milestone.description && (
                                    <div className="text-xs text-zinc-500 truncate">{milestone.description}</div>
                                )}
                                <span className={cn(
                                    'text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 inline-block',
                                    MILESTONE_STATUS_STYLES[milestone.status] || MILESTONE_STATUS_STYLES.PENDING
                                )}>
                                    {MILESTONE_STATUS_LABELS[milestone.status] || milestone.status}
                                </span>
                            </div>
                            <div className="col-span-2 text-center text-sm text-zinc-500">
                                {milestone.percentage ? `${milestone.percentage}%` : '—'}
                            </div>
                            <div className="col-span-3 text-right font-semibold text-sm text-zinc-900 dark:text-white">
                                {fmt(milestone.amount)}
                            </div>
                            <div className="col-span-2 text-center text-xs text-zinc-500">
                                {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString('es-GT') : '—'}
                            </div>
                            <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                {!readonly && (
                                    <button
                                        onClick={() => handleDeleteMilestone(milestone.id)}
                                        className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Add milestone form (existing plan) */}
                    {!readonly && (
                        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
                            <div className="px-4 py-3">
                                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-3">Agregar hito al plan</p>

                                <div className="grid grid-cols-12 gap-2 items-start">
                                    {/* Name */}
                                    <div className="col-span-4 space-y-1">
                                        <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                                            Nombre <span className="text-rose-500">*</span>
                                        </label>
                                        <Input
                                            placeholder="Ej. Segunda entrega"
                                            className={cn(
                                                'h-9 text-sm rounded-xl',
                                                addExistingErrors.name && 'border-rose-400 focus-visible:ring-rose-400'
                                            )}
                                            value={milestones[0].name}
                                            onChange={e => {
                                                updateMilestone(0, 'name', e.target.value);
                                                setAddExistingErrors(p => ({ ...p, name: undefined }));
                                            }}
                                        />
                                        {addExistingErrors.name && (
                                            <p className="text-xs text-rose-500 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3 shrink-0" />
                                                {addExistingErrors.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Percentage */}
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">%</label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                placeholder={quotationTotal ? '50' : '%'}
                                                min={0} max={100}
                                                className={cn(
                                                    'h-9 text-sm text-center rounded-xl pr-6',
                                                    addExistingErrors.percentage && 'border-rose-400 focus-visible:ring-rose-400'
                                                )}
                                                value={milestones[0].percentage}
                                                onChange={e => {
                                                    updateMilestone(0, 'percentage', e.target.value);
                                                    setAddExistingErrors(p => ({ ...p, percentage: undefined }));
                                                }}
                                            />
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none">%</span>
                                        </div>
                                        {addExistingErrors.percentage && (
                                            <p className="text-xs text-rose-500 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3 shrink-0" />
                                                {addExistingErrors.percentage}
                                            </p>
                                        )}
                                    </div>

                                    {/* Amount */}
                                    <div className="col-span-3 space-y-1">
                                        <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                                            Monto <span className="text-rose-500">*</span>
                                        </label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            min={0}
                                            className={cn(
                                                'h-9 text-sm text-right rounded-xl',
                                                addExistingErrors.amount && 'border-rose-400 focus-visible:ring-rose-400'
                                            )}
                                            value={milestones[0].amount}
                                            onChange={e => {
                                                updateMilestone(0, 'amount', e.target.value);
                                                setAddExistingErrors(p => ({ ...p, amount: undefined }));
                                            }}
                                        />
                                        {addExistingErrors.amount && (
                                            <p className="text-xs text-rose-500 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3 shrink-0" />
                                                {addExistingErrors.amount}
                                            </p>
                                        )}
                                    </div>

                                    {/* Due date */}
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Fecha límite</label>
                                        <Input
                                            type="date"
                                            className="h-9 text-sm rounded-xl"
                                            value={milestones[0].dueDate}
                                            onChange={e => updateMilestone(0, 'dueDate', e.target.value)}
                                        />
                                    </div>

                                    {/* Add button */}
                                    <div className="col-span-1 flex justify-end pt-5">
                                        <Button
                                            size="sm"
                                            className="h-9 w-9 p-0 rounded-xl"
                                            onClick={handleAddToExisting}
                                            disabled={isAddingToExisting}
                                            title="Agregar hito"
                                        >
                                            {isAddingToExisting
                                                ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                : <Plus className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {quotationTotal && (
                                    <p className="text-[11px] text-zinc-400 mt-2">
                                        💡 Ingresa el % y el monto se calculará automáticamente desde {fmt(quotationTotal)}.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── CREATE FORM VIEW ────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Crear Plan de Cobro</h3>

                {/* Quotation selector */}
                {quotations.length > 0 && (
                    <div className="mb-5">
                        <p className="text-xs text-zinc-500 font-medium mb-2">Basado en cotización</p>
                        <div className="flex gap-2 flex-wrap">
                            {quotations.map((q: any) => (
                                <button
                                    key={q.id}
                                    onClick={() => setSelectedQuotationId(q.id)}
                                    className={cn(
                                        'px-3 py-1.5 text-xs rounded-lg border transition-all',
                                        selectedQuotationId === q.id
                                            ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-primary/50'
                                    )}
                                >
                                    {q.optionName} — {fmt(q.total ?? 0)}
                                </button>
                            ))}
                        </div>
                        {quotationTotal !== null && (
                            <p className="text-[11px] text-zinc-400 mt-2">
                                💡 Ingresa el % y el monto del hito se calculará automáticamente desde {fmt(quotationTotal)}.
                            </p>
                        )}
                    </div>
                )}

                {/* Milestone rows */}
                <div className="space-y-3">
                    {milestones.map((m, idx) => {
                        const errs = fieldErrors[idx] || {};
                        const hasError = Object.keys(errs).length > 0;

                        return (
                            <div
                                key={idx}
                                className={cn(
                                    'rounded-xl border p-3 transition-colors',
                                    hasError
                                        ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-900/10'
                                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40'
                                )}
                            >
                                <div className="grid grid-cols-12 gap-2 items-start">
                                    {/* Name */}
                                    <div className="col-span-4 space-y-1">
                                        <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                                            Nombre del hito <span className="text-rose-500">*</span>
                                        </label>
                                        <Input
                                            placeholder="Ej. Anticipo"
                                            className={cn(
                                                'h-9 text-sm rounded-xl',
                                                errs.name && 'border-rose-400 focus-visible:ring-rose-400'
                                            )}
                                            value={m.name}
                                            onChange={e => updateMilestone(idx, 'name', e.target.value)}
                                        />
                                        {errs.name && (
                                            <p className="text-xs text-rose-500 flex items-center gap-1 mt-0.5">
                                                <AlertCircle className="w-3 h-3 shrink-0" />
                                                {errs.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Percentage */}
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                                            Porcentaje
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                placeholder={quotationTotal ? "50" : "%"}
                                                min={0} max={100}
                                                className={cn(
                                                    'h-9 text-sm text-center rounded-xl pr-6',
                                                    errs.percentage && 'border-rose-400 focus-visible:ring-rose-400'
                                                )}
                                                value={m.percentage}
                                                onChange={e => updateMilestone(idx, 'percentage', e.target.value)}
                                            />
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none">%</span>
                                        </div>
                                        {errs.percentage && (
                                            <p className="text-xs text-rose-500 flex items-center gap-1 mt-0.5">
                                                <AlertCircle className="w-3 h-3 shrink-0" />
                                                {errs.percentage}
                                            </p>
                                        )}
                                    </div>

                                    {/* Amount */}
                                    <div className="col-span-3 space-y-1">
                                        <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                                            Monto <span className="text-rose-500">*</span>
                                        </label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            min={0}
                                            className={cn(
                                                'h-9 text-sm text-right rounded-xl',
                                                errs.amount && 'border-rose-400 focus-visible:ring-rose-400'
                                            )}
                                            value={m.amount}
                                            onChange={e => updateMilestone(idx, 'amount', e.target.value)}
                                        />
                                        {errs.amount && (
                                            <p className="text-xs text-rose-500 flex items-center gap-1 mt-0.5">
                                                <AlertCircle className="w-3 h-3 shrink-0" />
                                                {errs.amount}
                                            </p>
                                        )}
                                    </div>

                                    {/* Due date */}
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                                            Fecha límite
                                        </label>
                                        <Input
                                            type="date"
                                            className="h-9 text-sm rounded-xl"
                                            value={m.dueDate}
                                            onChange={e => updateMilestone(idx, 'dueDate', e.target.value)}
                                        />
                                    </div>

                                    {/* Remove */}
                                    <div className="col-span-1 flex justify-end pt-5">
                                        {milestones.length > 1 && (
                                            <button
                                                onClick={() => handleRemoveMilestone(idx)}
                                                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                title="Eliminar hito"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-500 text-xs hover:text-zinc-700"
                        onClick={handleAddMilestone}
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Agregar otro hito
                    </Button>
                </div>

                {/* Summary footer */}
                <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                    {/* Totals */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-zinc-500">
                            Total del plan:{' '}
                            <span className="font-semibold text-zinc-900 dark:text-white">
                                {fmt(planDraftTotal)}
                            </span>
                            {quotationTotal && (
                                <span className="text-xs text-zinc-400 ml-2">
                                    / cotización: {fmt(quotationTotal)}
                                </span>
                            )}
                        </div>

                        {/* Live % coverage indicator */}
                        {quotationTotal && quotationTotal > 0 && planDraftTotal > 0 && (
                            <span className={cn(
                                'text-xs font-medium px-2.5 py-1 rounded-full',
                                Math.abs(planDraftTotal - quotationTotal) <= 0.01
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            )}>
                                {((planDraftTotal / quotationTotal) * 100).toFixed(1)}% cubierto
                            </span>
                        )}
                    </div>

                    {/* Mismatch warning */}
                    {hasQuotationMismatch && (
                        <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5 rounded-lg border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>
                                El plan cubre {fmt(planDraftTotal)} pero la cotización es de {fmt(quotationTotal!)}.{' '}
                                {planDraftTotal < quotationTotal!
                                    ? `Falta ${fmt(quotationTotal! - planDraftTotal)} por distribuir.`
                                    : `Hay ${fmt(planDraftTotal - quotationTotal!)} de más.`}
                            </span>
                        </div>
                    )}

                    {/* Submit error */}
                    {submitError && (
                        <div className="flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-3 py-2.5 rounded-lg border border-rose-200 dark:border-rose-800">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{submitError}</span>
                        </div>
                    )}

                    {/* All good indicator */}
                    {!submitError && !hasQuotationMismatch && planDraftTotal > 0 && (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>El plan está listo para guardar.</span>
                        </div>
                    )}

                    <Button
                        onClick={handleCreatePlan}
                        disabled={isSaving}
                        className="w-full rounded-xl h-10"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Plan de Cobro'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
