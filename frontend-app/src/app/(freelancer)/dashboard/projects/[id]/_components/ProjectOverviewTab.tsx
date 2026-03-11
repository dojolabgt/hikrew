'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, LayoutTemplate, Briefcase, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProjectData } from '../layout';

export function ProjectOverviewTab({ project }: { project: ProjectData }) {
    const { activeWorkspace } = useAuth();
    const { deal } = project;
    const brief = deal?.brief;
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
                    GTQ: 'Q', USD: '$', EUR: '€', MXN: '$', GBP: '£', JPY: '¥'
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
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 font-medium">Estado</p>
                            <p className="text-lg font-bold text-zinc-900 dark:text-white">
                                {project.status === 'COMPLETED' ? 'Completado' : 'En Curso'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 font-medium">Valor Total</p>
                            <p className="text-lg font-bold text-zinc-900 dark:text-white">
                                {quotation ? formatCurrency(quotation.total) : 'N/A'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 font-medium">Hitos de Pago</p>
                            <p className="text-lg font-bold text-zinc-900 dark:text-white">
                                Pendientes
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-zinc-50 dark:bg-zinc-900/20">
                    <CardContent className="p-5 py-4 flex flex-col justify-center h-full gap-2">
                        <Link href={`/dashboard/projects/${project.id}/tasks`} className="w-full">
                            <Button variant="outline" size="sm" className="w-full justify-between bg-white dark:bg-zinc-950">
                                Ver Tareas <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Intro / Context */}
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                        <CardTitle className="text-base font-semibold">Contexto del Proyecto</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {deal?.proposalIntro || 'No hay una descripción general establecida para este proyecto.'}
                        </p>
                        
                        <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                            {brief && (
                                <Link href={`/dashboard/projects/${project.id}/brief`} className="flex-1">
                                    <Button variant="secondary" className="w-full" size="sm">
                                        <LayoutTemplate className="w-4 h-4 mr-2" /> Leer Brief
                                    </Button>
                                </Link>
                            )}
                            {quotation && (
                                <Link href={`/dashboard/projects/${project.id}/assets`} className="flex-1">
                                    <Button variant="secondary" className="w-full" size="sm">
                                        <FileText className="w-4 h-4 mr-2" /> Ver Cotización
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Resumen de Cliente */}
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                        <CardTitle className="text-base font-semibold">Información del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Nombre</p>
                                <p className="font-medium text-sm text-zinc-900 dark:text-white">{deal?.client?.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Email</p>
                                <p className="text-sm text-zinc-700 dark:text-zinc-300">{deal?.client?.email || 'N/A'}</p>
                            </div>
                            {deal?.client?.whatsapp && (
                                <div>
                                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">WhatsApp</p>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{deal?.client?.whatsapp}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
