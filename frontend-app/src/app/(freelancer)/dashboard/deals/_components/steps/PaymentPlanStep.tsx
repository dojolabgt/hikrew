'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usePaymentPlan } from '@/hooks/use-payment-plan';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PaymentPlanStepProps {
    dealId: string;
    quotations: { id: string; optionName?: string; total?: number | string; isApproved?: boolean; currency?: string }[];
    currency?: { code: string; symbol: string };
    readonly?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deal?: Record<string, any>;
}

const MILESTONE_STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    PAID: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    OVERDUE: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
    CANCELLED: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500',
};
// Labels are computed inside the component using t()

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

export function PaymentPlanStep({ dealId, quotations, currency, readonly, deal }: PaymentPlanStepProps) {
    const { plan: paymentPlan, fetchPaymentPlan, createOrUpdatePlan: createPaymentPlan, addMilestone, deleteMilestone } = usePaymentPlan(dealId, deal?.workspace?.id || deal?.workspaceId);
    const { t } = useWorkspaceSettings();

    const MILESTONE_STATUS_LABELS: Record<string, string> = {
        PENDING: t('payment.milestoneStatusPending'),
        PAID: t('payment.milestoneStatusPaid'),
        OVERDUE: t('payment.milestoneStatusOverdue'),
        CANCELLED: t('payment.milestoneStatusCancelled'),
    };
    const [milestones, setMilestones] = useState<NewMilestone[]>([emptyMilestone()]);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingToExisting, setIsAddingToExisting] = useState(false);
    const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors[]>([{}]);
    const [addExistingErrors, setAddExistingErrors] = useState<FieldErrors>({});
    const [submitError, setSubmitError] = useState<string>('');
    const [deleteMilestoneId, setDeleteMilestoneId] = useState<string | null>(null);


    useEffect(() => {
        fetchPaymentPlan();
    }, [fetchPaymentPlan]);

    useEffect(() => {
        if (quotations.length > 0 && !selectedQuotationId) {
            const approved = quotations.find(q => q.isApproved);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedQuotationId(approved?.id || quotations[0]?.id || '');
        }
    }, [quotations, selectedQuotationId]);

    const selectedQuotation = quotations.find(q => q.id === selectedQuotationId);
    const quotationTotal = selectedQuotation ? Number(selectedQuotation.total ?? 0) : null;
    const currencySymbol = currency?.symbol || '$';
    const fmt = (n: number) => `${currencySymbol}${n.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;

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
            if (!m.name.trim()) e.name = t('payment.nameRequired');
            if (!m.amount || Number(m.amount) <= 0) {
                e.amount = !m.amount
                    ? t('payment.amountRequired')
                    : t('payment.amountPositive');
            }
            if (m.percentage && (Number(m.percentage) < 0 || Number(m.percentage) > 100)) {
                e.percentage = t('payment.percentageRange');
            }
            return e;
        });

        setFieldErrors(newErrors);
        const hasErrors = newErrors.some(e => Object.keys(e).length > 0);

        if (hasErrors) {
            const errorCount = newErrors.filter(e => Object.keys(e).length > 0).length;
            setSubmitError(
                errorCount === 1
                    ? t('payment.incompleteOneMilestone')
                    : t('payment.incompleteMilestones').replace('{count}', String(errorCount))
            );
        }

        // Check total vs quotation
        if (!hasErrors && quotationTotal) {
            const planTotal = milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0);
            const diff = Math.abs(planTotal - quotationTotal);
            if (diff > 0.01) {
                setSubmitError(
                    t('payment.totalMismatch')
                        .replace('{plan}', fmt(planTotal))
                        .replace('{quotation}', fmt(quotationTotal))
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
            toast.success(t('payment.planSaved'));
            setMilestones([emptyMilestone()]);
            setFieldErrors([{}]);
        } else {
            setSubmitError(t('payment.planSaveError'));
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
        if (!m.name.trim()) errs.name = t('payment.nameRequiredAlt');
        if (!m.amount || Number(m.amount) <= 0) {
            errs.amount = !m.amount ? t('payment.amountRequired') : t('payment.amountPositive');
        }
        if (m.percentage && (Number(m.percentage) < 0 || Number(m.percentage) > 100)) {
            errs.percentage = t('payment.percentageRange');
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
            toast.success(t('payment.milestoneAdded'));
            setMilestones([emptyMilestone()]);
            setAddExistingErrors({});
            // Refetch so the milestones list reflects the new entry
            await fetchPaymentPlan();
        } else {
            toast.error(t('payment.milestoneAddError'));
        }
    };

    const handleDeleteMilestone = async () => {
        if (!deleteMilestoneId) return;
        await deleteMilestone(deleteMilestoneId);
        setDeleteMilestoneId(null);
        await fetchPaymentPlan();
        toast.success(t('payment.milestoneDeleted'));
    };

    // ── Summary calculations ─────────────────────────────────────────────────

    const planDraftTotal = milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0);
    const existingPlanTotal = paymentPlan?.milestones?.reduce((s: number, m: { amount: number }) => s + Number(m.amount), 0) ?? 0;
    const hasQuotationMismatch = quotationTotal !== null && Math.abs(planDraftTotal - quotationTotal) > 0.01 && planDraftTotal > 0;

    // ── EXISTING PLAN VIEW ──────────────────────────────────────────────────

    if (paymentPlan) {
        return (
            <>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-zinc-900 dark:text-white">{t('payment.planTitle')}</h3>
                            <p className="text-sm text-zinc-500">
                                {t('payment.planTotal')}{' '}
                                <span className="font-semibold text-zinc-900 dark:text-white">
                                    {fmt(paymentPlan.totalAmount)}
                                </span>
                            </p>
                        </div>
                        {quotationTotal && Math.abs(existingPlanTotal - quotationTotal) > 0.01 && (
                            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {t('payment.existingMismatch')
                                    .replace('{plan}', fmt(existingPlanTotal))
                                    .replace('{quotation}', fmt(quotationTotal))}
                            </div>
                        )}
                    </div>

                    {/* Milestones list */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                            <div className="col-span-4">{t('payment.milestoneHeader')}</div>
                            <div className="col-span-2 text-center">%</div>
                            <div className="col-span-3 text-right">{t('payment.amountHeader')}</div>
                            <div className="col-span-2 text-center">{t('payment.dueDateLabel')}</div>
                            <div className="col-span-1" />
                        </div>

                        {paymentPlan.milestones?.map((milestone: { id: string; name: string; description?: string; status: string; percentage?: number; amount: number; dueDate?: string }) => (
                            <div key={milestone.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                                <div className="grid grid-cols-12 gap-2 items-center px-4 py-3 group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
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
                                    {fmt(Number(milestone.amount))}
                                </div>
                                <div className="col-span-2 text-center text-xs text-zinc-500">
                                    {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString('es-GT') : '—'}
                                </div>
                                <div className="col-span-1 flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!readonly && (
                                        <button
                                            onClick={() => setDeleteMilestoneId(milestone.id)}
                                            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500"
                                            title={t('payment.deleteHitoTitle')}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            

                        </div>
                    ))}

                        {/* Add milestone form (existing plan) */}
                        {!readonly && (
                            <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
                                <div className="px-4 py-3">
                                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-3">{t('payment.addMilestoneTitle')}</p>

                                    <div className="grid grid-cols-12 gap-2 items-start">
                                        {/* Name */}
                                        <div className="col-span-4 space-y-1">
                                            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                                                {t('payment.nameLabelShort')} <span className="text-rose-500">*</span>
                                            </label>
                                            <Input
                                                placeholder={t('payment.namePlaceholderSecond')}
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
                                                {t('payment.amountHeader')} <span className="text-rose-500">*</span>
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
                                            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{t('payment.dueDateLabel')}</label>
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
                                                title={t('payment.addMilestoneBtn')}
                                            >
                                                {isAddingToExisting
                                                    ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    : <Plus className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    {quotationTotal && (
                                        <p className="text-[11px] text-zinc-400 mt-2">
                                            {t('payment.autoCalcHintFrom').replace('{amount}', fmt(quotationTotal))}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fix 2.7 — Delete milestone AlertDialog */}
                <AlertDialog open={!!deleteMilestoneId} onOpenChange={o => !o && setDeleteMilestoneId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('payment.deleteConfirmTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('payment.deleteConfirmDesc')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={handleDeleteMilestone}>
                                {t('common.delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </>
        );
    }

    // ── CREATE FORM VIEW ────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">{t('payment.createPlanTitle')}</h3>

                {/* Quotation connection */}
                {quotations.length > 0 && (
                    <div className="mb-5">
                        {selectedQuotation?.isApproved ? (
                            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 mb-3">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                    {t('payment.linkedToApproved')}{' '}
                                    <strong>{selectedQuotation.optionName}</strong>{' '}
                                    — {fmt(Number(selectedQuotation.total ?? 0))}
                                </span>
                            </div>
                        ) : (
                            <>
                                <p className="text-xs text-zinc-500 font-medium mb-2">{t('payment.basedOnQuotation')}</p>
                                <div className="flex gap-2 flex-wrap mb-2">
                                    {quotations.map((q) => (
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
                                            {q.optionName} — {fmt(Number(q.total ?? 0))}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                        {quotationTotal !== null && (
                            <p className="text-[11px] text-zinc-400">
                                {t('payment.autoCalcHintFrom').replace('{amount}', fmt(quotationTotal))}
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
                                            {t('payment.nameLabel')} <span className="text-rose-500">*</span>
                                        </label>
                                        <Input
                                            placeholder={t('payment.namePlaceholder')}
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
                                            {t('payment.percentageLabel')}
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
                                            {t('payment.amountHeader')} <span className="text-rose-500">*</span>
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
                                            {t('payment.dueDateLabel')}
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
                                                                    title={t('payment.deleteHitoTitle')}
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
                        <Plus className="w-3.5 h-3.5 mr-1" /> {t('payment.addAnotherMilestone')}
                    </Button>
                </div>

                {/* Summary footer */}
                <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                    {/* Totals */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-zinc-500">
                            {t('payment.totalLabel')}{' '}
                            <span className="font-semibold text-zinc-900 dark:text-white">
                                {fmt(planDraftTotal)}
                            </span>
                            {quotationTotal && (
                                <span className="text-xs text-zinc-400 ml-2">
                                    {t('payment.quotationSuffix')} {fmt(quotationTotal)}
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
                                {((planDraftTotal / quotationTotal) * 100).toFixed(1)}% {t('payment.covered')}
                            </span>
                        )}
                    </div>

                    {/* Mismatch warning */}
                    {hasQuotationMismatch && (
                        <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5 rounded-lg border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>
                                {t('payment.mismatchCovers')
                                    .replace('{plan}', fmt(planDraftTotal))
                                    .replace('{quotation}', fmt(quotationTotal!))}{' '}
                                {planDraftTotal < quotationTotal!
                                    ? t('payment.missingToDistribute').replace('{amount}', fmt(quotationTotal! - planDraftTotal))
                                    : t('payment.excessAmount').replace('{amount}', fmt(planDraftTotal - quotationTotal!))}
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
                            <span>{t('payment.planReady')}</span>
                        </div>
                    )}

                    <Button
                        onClick={handleCreatePlan}
                        disabled={isSaving}
                        className="w-full rounded-xl h-10"
                    >
                        {isSaving ? t('payment.savingBtn') : t('payment.saveBtn')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
