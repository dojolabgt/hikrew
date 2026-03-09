'use client';

import React, { useEffect, useState } from 'react';
import { useQuotations } from '@/hooks/use-quotations';
import { ServicePickerDialog } from './ServicePickerDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Package, PenLine, ChevronDown, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuotationStepProps {
    dealId: string;
    currency?: { code: string; symbol: string };
    taxes?: any[];
    readonly?: boolean;
    onUpdate?: () => void | Promise<void>;
}

const CHARGE_LABELS: Record<string, string> = {
    ONE_TIME: 'Una vez',
    HOURLY: '/hr',
    RECURRING: '/mes',
};

export function QuotationStep({ dealId, currency, taxes, readonly, onUpdate }: QuotationStepProps) {
    const {
        quotations,
        fetchQuotations,
        createQuotation,
        updateQuotation,
        deleteQuotation,
        addItem,
        updateItem,
        deleteItem,
        isLoading,
    } = useQuotations(dealId);

    const [activeQuotationId, setActiveQuotationId] = useState<string | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Record<string, any>>({});

    useEffect(() => {
        fetchQuotations();
    }, [fetchQuotations]);

    useEffect(() => {
        if (quotations.length > 0 && !activeQuotationId) {
            setActiveQuotationId(quotations[0].id);
        }
    }, [quotations, activeQuotationId]);

    const activeQuotation = quotations.find(q => q.id === activeQuotationId);
    const currencySymbol = currency?.symbol || '$';

    const handleAddFromCatalog = async (service: any) => {
        if (!activeQuotationId) return;
        const result = await addItem(activeQuotationId, { serviceId: service.id });
        if (result) {
            toast.success(`"${service.name}" agregado a la cotización`);
            onUpdate?.();
        }
    };

    const handleAddManual = async () => {
        if (!activeQuotationId) return;
        const result = await addItem(activeQuotationId, { name: 'Nuevo ítem', price: 0, quantity: 1 });
        if (result) onUpdate?.();
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!activeQuotationId) return;
        await deleteItem(activeQuotationId, itemId);
        toast.success('Ítem eliminado');
        onUpdate?.();
    };

    const handleSaveItemEdit = async (itemId: string) => {
        if (!activeQuotationId) return;
        await updateItem(activeQuotationId, itemId, editValues);
        setEditingItemId(null);
        setEditValues({});
        onUpdate?.();
    };

    const handleApprove = async (quotationId: string) => {
        await updateQuotation(quotationId, { isApproved: true });
        toast.success('Cotización aprobada');
    };

    const fmt = (n: number) => `${currencySymbol}${Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;

    return (
        <div className="space-y-6">
            {/* Quotation Option Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {quotations.map((q) => (
                    <button
                        key={q.id}
                        onClick={() => setActiveQuotationId(q.id)}
                        className={cn(
                            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                            q.id === activeQuotationId
                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-primary/50'
                        )}
                    >
                        {q.isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {q.optionName}
                    </button>
                ))}

                {!readonly && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-dashed"
                        onClick={() => createQuotation({})}
                        disabled={isLoading}
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Nueva opción
                    </Button>
                )}
            </div>

            {/* Empty state */}
            {quotations.length === 0 && !isLoading && (
                <div className="h-48 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-400 gap-3">
                    <Package className="w-8 h-8" />
                    <div className="text-center">
                        <p className="font-medium text-sm">Sin cotizaciones aún</p>
                        <p className="text-xs mt-0.5">Crea tu primera opción de cotización</p>
                    </div>
                    <Button size="sm" onClick={() => createQuotation({})}>
                        <Plus className="w-4 h-4 mr-1.5" /> Crear Opción A
                    </Button>
                </div>
            )}

            {/* Active Quotation Canvas */}
            {activeQuotation && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    {/* Items table header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        <div className="col-span-4">Servicio / Ítem</div>
                        <div className="col-span-2">Tipo</div>
                        <div className="col-span-1 text-center">Cant.</div>
                        <div className="col-span-2 text-right">Precio</div>
                        <div className="col-span-2 text-right">Subtotal</div>
                        <div className="col-span-1"></div>
                    </div>

                    {/* Items */}
                    {(activeQuotation.items || []).length === 0 ? (
                        <div className="px-4 py-8 text-center text-zinc-400 text-sm">
                            Sin ítems. Agrega servicios del catálogo o crea un ítem manual.
                        </div>
                    ) : (
                        (activeQuotation.items || []).map((item: any) => {
                            const isEditing = editingItemId === item.id;
                            const lineTotal = Number(item.price) * Number(item.quantity) - Number(item.discount || 0);

                            if (isEditing) {
                                return (
                                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 bg-primary/5">
                                        <div className="col-span-4">
                                            <Input
                                                className="h-8 text-sm rounded-lg"
                                                value={editValues.name ?? item.name}
                                                onChange={e => setEditValues(p => ({ ...p, name: e.target.value }))}
                                            />
                                        </div>
                                        <div className="col-span-2 text-xs text-zinc-500">{CHARGE_LABELS[item.chargeType] || item.chargeType}</div>
                                        <div className="col-span-1">
                                            <Input
                                                type="number" min={1}
                                                className="h-8 text-sm text-center rounded-lg"
                                                value={editValues.quantity ?? item.quantity}
                                                onChange={e => setEditValues(p => ({ ...p, quantity: Number(e.target.value) }))}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="number" min={0}
                                                className="h-8 text-sm text-right rounded-lg"
                                                value={editValues.price ?? item.price}
                                                onChange={e => setEditValues(p => ({ ...p, price: Number(e.target.value) }))}
                                            />
                                        </div>
                                        <div className="col-span-2 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                            {fmt(lineTotal)}
                                        </div>
                                        <div className="col-span-1 flex justify-end gap-1">
                                            <Button size="sm" className="h-7 px-2 text-xs" onClick={() => handleSaveItemEdit(item.id)}>✓</Button>
                                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingItemId(null)}>✕</Button>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={item.id} className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 group hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                                    <div className="col-span-4">
                                        <div className="font-medium text-sm text-zinc-900 dark:text-white">{item.name}</div>
                                        {item.description && <div className="text-xs text-zinc-500 truncate">{item.description}</div>}
                                        {item.serviceId && <div className="text-[10px] text-primary/70 mt-0.5">📦 Del catálogo</div>}
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                                            {CHARGE_LABELS[item.chargeType] || item.chargeType}
                                        </span>
                                    </div>
                                    <div className="col-span-1 text-center text-sm text-zinc-700 dark:text-zinc-300">{item.quantity}</div>
                                    <div className="col-span-2 text-right text-sm text-zinc-700 dark:text-zinc-300">{fmt(item.price)}</div>
                                    <div className="col-span-2 text-right text-sm font-semibold text-zinc-900 dark:text-white">{fmt(lineTotal)}</div>
                                    <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!readonly && (
                                            <>
                                                <button
                                                    onClick={() => { setEditingItemId(item.id); setEditValues({}); }}
                                                    className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500"
                                                >
                                                    <PenLine className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Add buttons */}
                    {!readonly && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/20 border-t border-zinc-200 dark:border-zinc-800">
                            <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => setPickerOpen(true)}>
                                <Package className="w-3.5 h-3.5 mr-1.5" /> Del catálogo
                            </Button>
                            <Button size="sm" variant="ghost" className="rounded-xl text-xs text-zinc-500" onClick={handleAddManual}>
                                <PenLine className="w-3.5 h-3.5 mr-1.5" /> Ítem manual
                            </Button>
                        </div>
                    )}

                    {/* Totals */}
                    <div className="px-4 py-4 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5">
                        <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                            <span>Subtotal</span>
                            <span>{fmt(activeQuotation.subtotal ?? 0)}</span>
                        </div>
                        {Number(activeQuotation.discount) > 0 && (
                            <div className="flex justify-between text-sm text-emerald-600">
                                <span>Descuento</span>
                                <span>- {fmt(activeQuotation.discount)}</span>
                            </div>
                        )}
                        {Number(activeQuotation.taxTotal) > 0 && (
                            <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                                <span>Impuestos</span>
                                <span>{fmt(activeQuotation.taxTotal)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-base font-bold text-zinc-900 dark:text-white pt-1 border-t border-zinc-200 dark:border-zinc-700 mt-1">
                            <span>Total</span>
                            <span>{fmt(activeQuotation.total ?? 0)}</span>
                        </div>
                    </div>

                    {/* Approve button (if multiple quotations) */}
                    {!readonly && quotations.length > 1 && !activeQuotation.isApproved && (
                        <div className="px-4 py-3 flex justify-end border-t border-zinc-200 dark:border-zinc-800">
                            <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                onClick={() => handleApprove(activeQuotation.id)}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Aprobar esta opción
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Service Picker Dialog */}
            <ServicePickerDialog
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                onSelect={handleAddFromCatalog}
            />
        </div>
    );
}
