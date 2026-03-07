'use client';

import React, { useEffect, useState } from 'react';
import { useBriefTemplates } from '@/hooks/use-brief-templates';
import { Button } from '@/components/ui/button';
import { Plus, FileText, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { toast } from 'sonner';

interface BriefStepProps {
    initialSelectedTemplateId?: string | null;
    onSelectTemplate?: (id: string | null) => void;
}

export function BriefStep({ initialSelectedTemplateId, onSelectTemplate }: BriefStepProps) {
    const { templates, fetchTemplates, isLoading, updateTemplate, createTemplate } = useBriefTemplates();
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(initialSelectedTemplateId || null);
    const [isSaving, setIsSaving] = useState(false);
    const [schema, setSchema] = useState<any[]>([]);

    useEffect(() => {
        if (selectedTemplate) {
            const tpl = templates.find(t => t.id === selectedTemplate);
            setSchema(tpl?.schema || []);
        } else {
            setSchema([]);
        }
    }, [selectedTemplate, templates]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);



    const handleSelect = (tpl: { id: string; isActive?: boolean }) => {
        if (!tpl.isActive) return;
        setSelectedTemplate(tpl.id);
        if (onSelectTemplate) onSelectTemplate(tpl.id);
        toast.success(`Brief seleccionado y guardado adecuadamente`);
    };

    // ── Template list view ────────────────────────────────────────────────

    if (!selectedTemplate) {
        const columns: ColumnDef<any>[] = [
            {
                key: 'name',
                header: 'Nombre de Plantilla',
                render: (tpl) => (
                    <div>
                        <div className={`font-medium ${!tpl.isActive ? 'text-muted-foreground' : ''}`}>
                            {tpl.name}
                        </div>
                        {tpl.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                                {tpl.description}
                            </div>
                        )}
                    </div>
                ),
            },
            {
                key: 'questions',
                header: 'Preguntas',
                render: (tpl) => (
                    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                        {tpl.schema?.length || 0} campos
                    </span>
                ),
            },
            {
                key: 'status',
                header: 'Estado',
                render: (tpl) =>
                    tpl.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Activa
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            <XCircle className="w-3.5 h-3.5" /> Inactiva
                        </span>
                    ),
            },
            {
                key: 'action',
                header: '',
                className: 'text-right',
                render: (tpl) => (
                    <Button
                        size="sm"
                        variant={tpl.isActive ? 'outline' : 'ghost'}
                        disabled={!tpl.isActive}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(tpl);
                        }}
                        className="text-xs"
                    >
                        Usar <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                ),
            },
        ];

        return (
            <div className="space-y-6">
                {/* Sub-header */}
                <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div>
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Selecciona un Brief</h3>
                        <p className="text-sm text-zinc-500 mt-0.5 max-w-lg">
                            Selecciona una plantilla para que tu cliente la llene. Puedes crear y editar plantillas desde los Ajustes.
                        </p>
                    </div>
                </div>

                {/* Template table */}
                <DataTable
                    data={templates}
                    columns={columns}
                    isLoading={isLoading}
                    emptyIcon={<FileText className="w-8 h-8" />}
                    emptyTitle="No tienes plantillas creadas"
                    emptyDescription="Acelera tus ventas teniendo formatos de cuestionarios listos para enviar. Dirígete a Ajustes para crear tu primera plantilla."
                />
            </div>
        );
    }

    // ── Template preview view (Read Only) ──────────────────────────────────────────────

    const handleBack = () => {
        // Clear local selection and notify parent
        setSelectedTemplate(null);
        if (onSelectTemplate) {
            onSelectTemplate(null);
        }
    };

    const tpl = templates.find(t => t.id === selectedTemplate);

    return (
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl shadow-sm">
            {/* Editor header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 rounded-t-xl">
                <div>
                    <span className="text-xs font-semibold text-primary/80 uppercase tracking-widest">Vista Previa de Brief</span>
                    <h3 className="font-medium text-zinc-900 dark:text-white mt-0.5">
                        {tpl?.name || 'Plantilla'}
                    </h3>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={handleBack}>
                        Cambiar Plantilla
                    </Button>
                </div>
            </div>

            <div className="p-6 md:p-8">
                {schema.length === 0 ? (
                    <div className="h-48 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-400">
                        <p className="mb-4">Este brief está vacío.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {schema.map((field, idx) => (
                            <div
                                key={field.id}
                                className="p-4 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-lg relative group"
                            >
                                <div className="absolute -left-3 -top-3 w-6 h-6 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white dark:ring-zinc-950">
                                    {idx + 1}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-zinc-500 mb-1 block">
                                            Pregunta / Título del campo
                                        </label>
                                        <div className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-3 flex items-center text-sm text-zinc-700 dark:text-zinc-300">
                                            {field.label || 'Sin pregunta asignada'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-zinc-500 mb-1 block">
                                            Tipo de respuesta
                                        </label>
                                        <div className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-3 flex items-center text-sm text-zinc-700 dark:text-zinc-300 capitalize">
                                            {field.type}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 col-span-full">
                                        <input
                                            type="checkbox"
                                            id={`req-${field.id}`}
                                            checked={field.required}
                                            readOnly
                                            className="rounded border-zinc-300 text-primary cursor-default opacity-70"
                                        />
                                        <label
                                            htmlFor={`req-${field.id}`}
                                            className="text-sm text-zinc-600 dark:text-zinc-400"
                                        >
                                            Campo obligatorio
                                        </label>
                                    </div>

                                    {/* New properties preview */}
                                    <div className="col-span-full pt-2 mt-2 border-t border-zinc-200/50 dark:border-zinc-800/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {(field.description || field.tooltip || field.placeholder) && (
                                            <div className="text-xs space-y-1">
                                                {field.description && <p><span className="text-zinc-500 font-medium">Descripción:</span> {field.description}</p>}
                                                {field.tooltip && <p><span className="text-zinc-500 font-medium">Tooltip ℹ️:</span> {field.tooltip}</p>}
                                                {field.placeholder && <p><span className="text-zinc-500 font-medium">Placeholder:</span> {field.placeholder}</p>}
                                            </div>
                                        )}

                                        <div className="text-xs space-y-1">
                                            {field.allowOther && (
                                                <p className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Permite respuesta personalizada ("Otro")
                                                </p>
                                            )}
                                            {field.dependsOn?.fieldId && (
                                                <p className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded w-fit">
                                                    <span className="font-semibold">Condición:</span>
                                                    Visible si pregunto anterior es "{field.dependsOn.value}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
