'use client';

import React, { useState } from 'react';
import { usePaymentPlan } from '@/hooks/use-payment-plan';
import { useProjects } from '@/hooks/use-projects';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';
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

import { ProjectData } from '../layout';

interface ProjectPaymentsTabProps {
    project: ProjectData;
    isOwner: boolean;
    onUpdate: () => void;
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

export function ProjectPaymentsTab({ project, isOwner, onUpdate }: ProjectPaymentsTabProps) {
    const { activeWorkspace } = useAuth();
    const dealId = project?.deal?.id;
    const { plan: paymentPlan, updateMilestone: updateMilestoneApi, fetchPaymentPlan } = usePaymentPlan(dealId || '', project.workspaceId);
    const { addMilestoneSplit, deleteMilestoneSplit } = useProjects();
    
    // UI states
    const [markPaidId, setMarkPaidId] = useState<string | null>(null);
    const [isMarkingPaid, setIsMarkingPaid] = useState(false);

    // Splits states
    const [addingSplitMilestoneId, setAddingSplitMilestoneId] = useState<string | null>(null);
    const [splitForm, setSplitForm] = useState({ collaboratorWorkspaceId: '', amount: '', percentage: '' });
    const [isAddingSplit, setIsAddingSplit] = useState(false);

    const getCurrencySymbol = () => {
        const quotation = project?.deal?.quotations?.find((q: { isApproved?: boolean }) => q.isApproved) || project?.deal?.quotations?.[0];
        let symbol = project?.deal?.currency?.symbol || '$';
        if (quotation?.currency) {
            if (activeWorkspace?.currencies && activeWorkspace.currencies.length > 0) {
                const found = activeWorkspace.currencies.find((c: { code: string; symbol: string }) => c.code === quotation.currency);
                if (found) symbol = found.symbol;
                else symbol = quotation.currency;
            } else {
                const fallbacks: Record<string, string> = {
                    GTQ: 'Q', USD: '$', EUR: '€', MXN: '$', GBP: '£', JPY: '¥',
                    CAD: '$', AUD: '$', CHF: 'Fr', CNY: '¥', BRL: 'R$', COP: '$',
                    ARS: '$', PEN: 'S/', CLP: '$', CRC: '₡', HNL: 'L', NIO: 'C$',
                    DOP: 'RD$', KRW: '₩', INR: '₹', SAR: '﷼', AED: 'د.إ'
                };
                symbol = fallbacks[quotation.currency] || quotation.currency;
            }
        }
        return symbol;
    };

    const currencySymbol = getCurrencySymbol();

    React.useEffect(() => {
        if (dealId) {
            fetchPaymentPlan();
        }
    }, [dealId, fetchPaymentPlan]);

    if (!paymentPlan) {
        return (
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center">
                <p className="text-sm text-zinc-500">No hay un plan de pagos configurado para este proyecto.</p>
            </div>
        );
    }

    const handleMarkAsPaid = async () => {
        if (!markPaidId) return;
        setIsMarkingPaid(true);
        const milestone = paymentPlan?.milestones?.find((m: { id: string; status: string }) => m.id === markPaidId);
        const newStatus = milestone?.status === 'PAID' ? 'PENDING' : 'PAID';
        await updateMilestoneApi(markPaidId, { status: newStatus });
        setMarkPaidId(null);
        setIsMarkingPaid(false);
        await fetchPaymentPlan();
        onUpdate();
        toast.success(newStatus === 'PAID' ? 'Hito marcado como pagado' : 'Hito regresado a pendiente');
    };

    const handleOpenSplit = (milestoneId: string) => {
        setAddingSplitMilestoneId(milestoneId);
        setSplitForm({ collaboratorWorkspaceId: '', amount: '', percentage: '' });
    };

    const handleSplitFormChange = (field: string, value: string, milestoneAmount: number) => {
        setSplitForm(prev => {
            const next = { ...prev, [field]: value };
            if (field === 'percentage' && value !== '') {
                const pct = parseFloat(value);
                if (!isNaN(pct)) next.amount = ((pct / 100) * milestoneAmount).toFixed(2);
            }
            if (field === 'amount' && value !== '' && milestoneAmount > 0) {
                const amt = parseFloat(value);
                if (!isNaN(amt)) next.percentage = ((amt / milestoneAmount) * 100).toFixed(1);
            }
            return next;
        });
    };

    const handleSaveSplit = async (milestoneId: string) => {
        if (!splitForm.collaboratorWorkspaceId || !splitForm.amount) {
            toast.error('Selecciona a un colaborador y escribe un monto.');
            return;
        }
        setIsAddingSplit(true);
        const result = await addMilestoneSplit(project.id, milestoneId, {
            collaboratorWorkspaceId: splitForm.collaboratorWorkspaceId,
            amount: Number(splitForm.amount),
            percentage: splitForm.percentage ? Number(splitForm.percentage) : undefined,
        });
        setIsAddingSplit(false);
        if (result) {
            toast.success('Reparto agregado');
            setAddingSplitMilestoneId(null);
            await fetchPaymentPlan();
            onUpdate();
        }
    };

    const handleDeleteSplit = async (milestoneId: string, splitId: string) => {
        const deleted = await deleteMilestoneSplit(project.id, milestoneId, splitId);
        if (deleted) {
            toast.success('Reparto eliminado');
            await fetchPaymentPlan();
            onUpdate();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">Plan de Cobro y Repartos</h3>
                    <p className="text-sm text-zinc-500">
                        Total del proyecto:{' '}
                        <span className="font-semibold text-zinc-900 dark:text-white">
                            {currencySymbol}{formatCurrency(paymentPlan.totalAmount).replace('$', '')}
                        </span>
                    </p>
                </div>
            </div>

            {/* Milestones list */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-zinc-50/80 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    <div className="col-span-4">Hito</div>
                    <div className="col-span-2 text-center">%</div>
                    <div className="col-span-3 text-right">Monto</div>
                    <div className="col-span-2 text-center">Fecha</div>
                    <div className="col-span-1" />
                </div>

                {paymentPlan.milestones?.map((milestone: { id: string; name: string; description?: string; status: string; percentage?: number; amount: number; dueDate?: string; splits?: { id: string; collaboratorWorkspace?: { businessName: string }; percentage?: number; amount: number }[] }) => (
                    <div key={milestone.id} className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                        <div className="grid grid-cols-12 gap-2 items-center px-4 py-3 group hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 transition-colors">
                            <div className="col-span-4">
                                <div className="font-medium text-sm text-zinc-900 dark:text-white">{milestone.name}</div>
                                {milestone.description && (
                                    <div className="text-xs text-zinc-500 truncate">{milestone.description}</div>
                                )}
                                <span className={cn(
                                    'text-[10px] px-2 py-0.5 rounded-full font-medium mt-1.5 inline-block',
                                    MILESTONE_STATUS_STYLES[milestone.status] || MILESTONE_STATUS_STYLES.PENDING
                                )}>
                                    {MILESTONE_STATUS_LABELS[milestone.status] || milestone.status}
                                </span>
                            </div>
                            <div className="col-span-2 text-center text-sm text-zinc-500">
                                {milestone.percentage ? `${milestone.percentage}%` : '—'}
                            </div>
                            <div className="col-span-3 text-right font-semibold text-sm text-zinc-900 dark:text-white">
                                {currencySymbol}{formatCurrency(milestone.amount).replace('$', '')}
                            </div>
                            <div className="col-span-2 text-center text-xs text-zinc-500">
                                {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString('es-GT') : '—'}
                            </div>
                            <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {isOwner && (
                                    <button
                                        onClick={() => setMarkPaidId(milestone.id)}
                                        className={cn(
                                            'p-1.5 rounded-lg transition-colors',
                                            milestone.status === 'PAID'
                                                ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40'
                                                : 'text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                        )}
                                        title={milestone.status === 'PAID' ? 'Marcar como pendiente' : 'Marcar como pagado'}
                                    >
                                        <BadgeCheck className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Splits Section */}
                        {(project.collaborators?.length ?? 0) > 0 && (
                            <div className="px-4 pb-3 pt-2 bg-zinc-50/50 dark:bg-zinc-900/20 border-t border-zinc-100 dark:border-zinc-800/50">
                                <div className="flex items-center justify-between mb-2.5">
                                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                        Distribución (Splits)
                                    </span>
                                    {isOwner && addingSplitMilestoneId !== milestone.id && (
                                        <Button variant="ghost" size="sm" className="h-6 px-2.5 text-[11px] text-primary" onClick={() => handleOpenSplit(milestone.id)}>
                                            <Plus className="w-3 h-3 mr-1" /> Nuevo Reparto
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    {milestone.splits?.map((split) => (
                                        <div key={split.id} className="flex flex-wrap items-center justify-between px-3.5 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm shadow-sm transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                                    {split.collaboratorWorkspace?.businessName || 'Colaborador Oculto'}
                                                </span>
                                                {split.percentage && <span className="text-[11px] text-zinc-400 px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">{split.percentage}%</span>}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold text-zinc-900 dark:text-white">{currencySymbol}{formatCurrency(Number(split.amount)).replace('$', '')}</span>
                                                {isOwner && (
                                                    <button
                                                        onClick={() => handleDeleteSplit(milestone.id, split.id)}
                                                        className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-1 rounded-md transition-colors"
                                                        title="Eliminar Reparto"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {(!milestone.splits || milestone.splits.length === 0) && addingSplitMilestoneId !== milestone.id && (
                                        <p className="text-xs text-zinc-400 italic px-2">Sin repartos asignados.</p>
                                    )}
                                </div>

                                {addingSplitMilestoneId === milestone.id && isOwner && (
                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 items-end bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                        <div className="md:col-span-2 space-y-1.5">
                                            <label className="text-[10px] uppercase text-zinc-500 font-semibold tracking-wide">Colaborador</label>
                                            <select
                                                className="w-full h-9 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                                                value={splitForm.collaboratorWorkspaceId}
                                                onChange={e => handleSplitFormChange('collaboratorWorkspaceId', e.target.value, milestone.amount)}
                                            >
                                                <option value="">Selecciona uno...</option>
                                                {project.collaborators?.map((c) => (
                                                    <option key={c.workspace.id} value={c.workspace.id}>
                                                        {c.workspace.businessName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase text-zinc-500 font-semibold tracking-wide">Monto</label>
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">{currencySymbol}</span>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    max={milestone.amount}
                                                    className="h-9 text-sm pl-7 rounded-lg"
                                                    value={splitForm.amount}
                                                    onChange={e => handleSplitFormChange('amount', e.target.value, milestone.amount)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 h-9">
                                            <Button size="sm" variant="outline" className="h-9 flex-1 text-xs rounded-lg" onClick={() => setAddingSplitMilestoneId(null)}>
                                                Cancelar
                                            </Button>
                                            <Button size="sm" className="h-9 flex-1 text-xs rounded-lg shadow-sm" disabled={isAddingSplit} onClick={() => handleSaveSplit(milestone.id)}>
                                                {isAddingSplit ? '...' : 'Guardar'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Mark as Paid AlertDialog */}
            <AlertDialog open={!!markPaidId} onOpenChange={o => !o && setMarkPaidId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {paymentPlan?.milestones?.find((m: { id: string; status: string }) => m.id === markPaidId)?.status === 'PAID'
                                ? '¿Marcar como Pendiente?'
                                : '¿Confirmar pago recibido?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {paymentPlan?.milestones?.find((m: { id: string; status: string }) => m.id === markPaidId)?.status === 'PAID'
                                ? 'El hito regresará al estado Pendiente y ya no se contabilizará como ingreso.'
                                : 'Confirma que ya recibiste el pago para este hito. Esto lo marcará como Pagado para todo el equipo.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleMarkAsPaid} disabled={isMarkingPaid}>
                            {isMarkingPaid ? 'Guardando...' : 'Confirmar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
