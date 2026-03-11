'use client';

import React from 'react';
import { useProject } from '../layout';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProjectAssetsPage() {
    const { project } = useProject();
    const { activeWorkspace } = useAuth();
    const { deal } = project;
    const quotation = deal?.quotations?.find((q: { isApproved?: boolean }) => q.isApproved) || deal?.quotations?.[0];

    const getCurrencySymbol = () => {
        let symbol = deal?.currency?.symbol || '$';
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

    const formatCurrency = (val?: number | string) => {
        if (val === undefined || val === null) return `${getCurrencySymbol()}0.00`;
        return `${getCurrencySymbol()}${Number(val).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Archivos y Documentos</h2>
                    <p className="text-sm text-zinc-500">Documentos formales y bases del proyecto (Cotizaciones, Contratos, etc).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Quotation Card */}
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    <CardHeader className="pb-3 pt-5">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Cotización Aprobada
                            </CardTitle>
                            {quotation?.isApproved && (
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200">
                                    Aprobada
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {quotation ? (
                            <div className="space-y-5">
                                <div>
                                    <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 mb-1">
                                        {quotation.optionName || 'Cotización Única'}
                                    </h3>
                                    {quotation.description && (
                                        <p className="text-sm text-zinc-500 line-clamp-2">{quotation.description}</p>
                                    )}
                                </div>
                                    
                                <div className="space-y-2 text-sm max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {quotation.items?.map((item: { name: string; quantity: string | number; price: string | number }, idx: number) => (
                                        <div key={idx} className="flex justify-between items-start py-2 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
                                            <div className="pr-3 flex-1">
                                                <p className="font-medium text-zinc-800 dark:text-zinc-200 text-[13px]">{item.name}</p>
                                                <p className="text-[11px] text-zinc-400 mt-0.5">Cant: {item.quantity}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-semibold text-zinc-900 dark:text-white text-[13px]">{formatCurrency(item.price)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-zinc-200 dark:border-zinc-800">
                                    <span className="font-medium text-sm text-zinc-600 dark:text-zinc-400">Total:</span>
                                    <span className="text-lg font-bold text-zinc-900 dark:text-white">
                                        {formatCurrency(quotation.total)} 
                                        {quotation.currency && <span className="text-[10px] font-normal text-zinc-500 ml-1">{quotation.currency}</span>}
                                    </span>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(`${process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'http://localhost:3001'}/d/${deal?.publicToken}`, '_blank')}>
                                        <Share2 className="w-4 h-4 mr-2" /> Ver Pública
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-6 text-center">
                                <p className="text-sm text-zinc-500">No hay cotización asociada.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Placeholder for Contracts/Invoices */}
                <Card className="border-dashed border-2 border-zinc-200 dark:border-zinc-800 shadow-none flex flex-col items-center justify-center p-6 text-center bg-zinc-50/50 dark:bg-zinc-900/10">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-400">
                        <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 mb-1">Nuevo Activo</h3>
                    <p className="text-xs text-zinc-500 mb-4 max-w-[200px]">Sube contratos, NDA o facturas a este espacio próximamente.</p>
                    <Button variant="secondary" size="sm" disabled>
                        Subir Archivo
                    </Button>
                </Card>
            </div>
        </div>
    );
}
