'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Package, Plus } from 'lucide-react';
import { servicesApi } from '@/features/services/api';
import { cn } from '@/lib/utils';

interface ServicePickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (service: any) => void;
    currency?: string;
    currencySymbol?: string;
}

export function ServicePickerDialog({ open, onOpenChange, onSelect, currency = 'GTQ', currencySymbol = 'Q' }: ServicePickerDialogProps) {
    const [services, setServices] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setIsLoading(true);
            servicesApi.getAll()
                .then(setServices)
                .catch(console.error)
                .finally(() => setIsLoading(false));
        }
    }, [open]);

    const filtered = services.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.category || '').toLowerCase().includes(search.toLowerCase())
    );

    const chargeTypeLabel: Record<string, string> = {
        ONE_TIME: 'Una vez',
        HOURLY: 'Por hora',
        RECURRING: 'Recurrente',
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Agregar desde Catálogo</DialogTitle>
                    <DialogDescription>
                        Selecciona un servicio. Sus datos se copiarán como snapshot al ítem de la cotización.
                    </DialogDescription>
                </DialogHeader>

                {/* Search */}
                <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                        placeholder="Buscar por nombre o categoría..."
                        className="pl-9 rounded-xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Service List */}
                <div className="mt-2 max-h-80 overflow-y-auto space-y-1 pr-1">
                    {isLoading && (
                        <div className="flex items-center justify-center py-8 text-zinc-400">
                            <div className="w-5 h-5 border-2 border-zinc-300 border-t-primary rounded-full animate-spin" />
                        </div>
                    )}

                    {!isLoading && filtered.length === 0 && (
                        <div className="flex flex-col items-center py-8 text-zinc-400">
                            <Package className="w-8 h-8 mb-2" />
                            <p className="text-sm">No se encontraron servicios</p>
                        </div>
                    )}

                    {filtered.map(service => {
                        const price = service.basePrice?.[currency] ?? 0;
                        return (
                            <button
                                key={service.id}
                                onClick={() => { onSelect(service); onOpenChange(false); }}
                                className={cn(
                                    'w-full text-left rounded-xl border border-zinc-200 dark:border-zinc-800',
                                    'bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900',
                                    'px-4 py-3 transition-colors flex items-start justify-between gap-3',
                                    'focus:outline-none focus:ring-2 focus:ring-primary/50'
                                )}
                            >
                                <div className="min-w-0">
                                    <div className="font-medium text-sm text-zinc-900 dark:text-white truncate">
                                        {service.name}
                                    </div>
                                    {service.description && (
                                        <p className="text-xs text-zinc-500 truncate mt-0.5">{service.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                        {service.category && (
                                            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                                                {service.category}
                                            </span>
                                        )}
                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                            {chargeTypeLabel[service.chargeType] || service.chargeType}
                                        </span>
                                    </div>
                                </div>
                                <div className="shrink-0 text-right">
                                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                                        {currencySymbol}{Number(price).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                    </span>
                                    <div className="text-xs text-zinc-400">{currency}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
