'use client';

import React, { useEffect, useState } from 'react';
import { useBriefTemplates } from '@/hooks/use-brief-templates';
import { Button } from '@/components/ui/button';
import { Plus, FileText, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable, ColumnDef } from '@/components/common/DataTable';

interface BriefStepProps {
    initialSelectedTemplateId?: string | null;
    onSelectTemplate?: (id: string | null) => void;
}

export function BriefStep({ initialSelectedTemplateId, onSelectTemplate }: BriefStepProps) {
    const { templates, fetchTemplates, isLoading, updateTemplate, createTemplate } = useBriefTemplates();
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(initialSelectedTemplateId || null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newTplName, setNewTplName] = useState('');
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

    const handleCreateTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTplName) return;
        const res = await createTemplate({ name: newTplName, description: 'Nueva plantilla vacía', schema: [], isActive: true });
        if (res && res.id) {
            setNewTplName('');
            setIsDialogOpen(false);
            setSelectedTemplate(res.id);
            if (onSelectTemplate) onSelectTemplate(res.id);
        }
    };

    const handleSelect = (tpl: { id: string; isActive?: boolean }) => {
        if (!tpl.isActive) return;
        setSelectedTemplate(tpl.id);
        if (onSelectTemplate) onSelectTemplate(tpl.id);
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
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Empezar un Brief</h3>
                        <p className="text-sm text-zinc-500 mt-0.5 max-w-lg">
                            Selecciona una plantilla para que tu cliente la llene, o crea una desde cero.
                        </p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" /> Nueva Plantilla
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Crear nueva plantilla de Brief</DialogTitle>
                                <DialogDescription>
                                    Define el nombre de la plantilla, luego podrás configurar las preguntas.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateTemplate} className="space-y-4">
                                <div>
                                    <Label>Nombre de Plantilla</Label>
                                    <Input
                                        value={newTplName}
                                        onChange={(e) => setNewTplName(e.target.value)}
                                        placeholder="Ej. Diseño Web..."
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={!newTplName}>
                                        Crear
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Template table */}
                <DataTable
                    data={templates}
                    columns={columns}
                    isLoading={isLoading}
                    emptyIcon={<FileText className="w-8 h-8" />}
                    emptyTitle="No tienes plantillas creadas"
                    emptyDescription="Acelera tus ventas teniendo formatos de cuestionarios listos para enviar."
                    emptyAction={
                        <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                            Crear primera plantilla
                        </Button>
                    }
                />
            </div>
        );
    }

    // ── Template editor view ──────────────────────────────────────────────

    const addField = () => {
        setSchema([...schema, { id: Date.now().toString(), type: 'text', question: '', required: false, options: [] }]);
    };

    const updateField = (id: string, updates: any) => {
        setSchema(schema.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const removeField = (id: string) => {
        setSchema(schema.filter(f => f.id !== id));
    };

    const handleSave = async () => {
        if (!selectedTemplate) return;
        setIsSaving(true);
        await updateTemplate(selectedTemplate, { schema });
        setIsSaving(false);
    };

    const tpl = templates.find(t => t.id === selectedTemplate);

    return (
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl shadow-sm">
            {/* Editor header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 rounded-t-xl">
                <div>
                    <span className="text-xs font-semibold text-primary/80 uppercase tracking-widest">Editor de Brief</span>
                    <h3 className="font-medium text-zinc-900 dark:text-white mt-0.5">
                        {tpl?.name || 'Plantilla'}
                    </h3>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => {
                        setSelectedTemplate(null);
                        if (onSelectTemplate) onSelectTemplate(null);
                    }}>
                        Cambiar
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar Plantilla'}
                    </Button>
                </div>
            </div>

            <div className="p-6 md:p-8">
                {schema.length === 0 ? (
                    <div className="h-48 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-400">
                        <p className="mb-4">Este brief está vacío.</p>
                        <Button variant="outline" size="sm" onClick={addField}>
                            <Plus className="w-4 h-4 mr-2" /> Agregar primera pregunta
                        </Button>
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
                                <div className="flex items-center justify-end mb-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeField(field.id)}
                                        className="h-6 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                    >
                                        Eliminar
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-zinc-500 mb-1 block">
                                            Pregunta / Título del campo
                                        </label>
                                        <input
                                            value={field.question}
                                            onChange={(e) => updateField(field.id, { question: e.target.value })}
                                            className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                            placeholder="Ej. ¿Cuál es el objetivo principal?"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-zinc-500 mb-1 block">
                                            Tipo de respuesta
                                        </label>
                                        <select
                                            value={field.type}
                                            onChange={(e) => updateField(field.id, { type: e.target.value })}
                                            className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="text">Texto corto</option>
                                            <option value="textarea">Párrafo largo</option>
                                            <option value="radio">Opciones Múltiples</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 col-span-full">
                                        <input
                                            type="checkbox"
                                            id={`req-${field.id}`}
                                            checked={field.required}
                                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                            className="rounded border-zinc-300 text-primary focus:ring-primary"
                                        />
                                        <label
                                            htmlFor={`req-${field.id}`}
                                            className="text-sm text-zinc-600 dark:text-zinc-400"
                                        >
                                            Campo obligatorio
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Button variant="outline" className="w-full border-dashed" onClick={addField}>
                            <Plus className="w-4 h-4 mr-2" /> Agregar otra pregunta
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
