'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBriefTemplates, BriefTemplate } from '@/hooks/use-brief-templates';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Settings2, Trash2, ArrowLeft } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BriefBuilder } from './_components/BriefBuilder'; // We will create this

export default function BriefTemplatesPage() {
    const searchParams = useSearchParams();
    const editParam = searchParams.get('edit');

    const { templates, fetchTemplates, isLoading, createTemplate } = useBriefTemplates();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newTplName, setNewTplName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // If a template is selected, we show the builder instead of the list
    const [editingTemplate, setEditingTemplate] = useState<BriefTemplate | null>(null);

    useEffect(() => {
        if (!editingTemplate) {
            fetchTemplates();
        }
    }, [fetchTemplates, editingTemplate]);

    // Open template from ?edit= query param once templates load
    useEffect(() => {
        if (editParam && templates.length > 0 && !editingTemplate) {
            const found = templates.find(t => t.id === editParam);
            if (found) setEditingTemplate(found);
        }
    }, [editParam, templates, editingTemplate]);


    const handleCreateTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTplName) return;

        setIsCreating(true);
        try {
            const res = await createTemplate({
                name: newTplName,
                description: 'Plantilla personalizada',
                schema: [],
                isActive: true
            });

            if (res && res.id) {
                toast.success('Plantilla creada correctamente');
                setNewTplName('');
                setIsDialogOpen(false);
                setEditingTemplate(res); // Go straight to edit mode
            }
        } catch (err: any) {
            toast.error(err.message || 'Error al crear plantilla');
        } finally {
            setIsCreating(false);
        }
    };

    if (editingTemplate) {
        return (
            <div className="p-6 md:p-10 h-full flex flex-col">
                <div className="mb-6 flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setEditingTemplate(null)} className="-ml-3 text-zinc-500">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Plantillas
                    </Button>
                </div>
                <BriefBuilder
                    template={editingTemplate}
                    onClose={() => setEditingTemplate(null)}
                />
            </div>
        );
    }

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
            render: (tpl) => (
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${tpl.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                    {tpl.isActive ? 'Activa' : 'Inactiva'}
                </span>
            ),
        },
        {
            key: 'action',
            header: '',
            className: 'text-right',
            render: (tpl) => (
                <div className="flex justify-end items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingTemplate(tpl);
                        }}
                    >
                        <Settings2 className="w-4 h-4 mr-2 text-zinc-500" />
                        Configurar
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Plantillas de Brief</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
                        Crea cuestionarios estandarizados que tus clientes deberán llenar al iniciar un nuevo trato. Automáticamente se adjuntarán a su propuesta.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="shadow-sm">
                            <Plus className="w-4 h-4 mr-2" /> Nueva Plantilla
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nueva plantilla de Brief</DialogTitle>
                            <DialogDescription>
                                Dale un nombre para identificarla. Luego podrás agregar todos los campos requeridos.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateTemplate} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Nombre de la Plantilla</Label>
                                <Input
                                    value={newTplName}
                                    onChange={(e) => setNewTplName(e.target.value)}
                                    placeholder="Ej. Formulario Inicial Web..."
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)} disabled={isCreating}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={!newTplName || isCreating}>
                                    {isCreating ? 'Creando...' : 'Crear y Continuar'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                <DataTable
                    data={templates}
                    columns={columns}
                    isLoading={isLoading}
                    emptyIcon={<FileText className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />}
                    emptyTitle="No tienes plantillas creadas"
                    emptyDescription="Acelera tus ventas teniendo formatos de cuestionarios listos para que tus clientes llenen. Empieza creando tu primera plantilla."
                    emptyAction={
                        <Button variant="outline" onClick={() => setIsDialogOpen(true)} className="mt-4">
                            <Plus className="w-4 h-4 mr-2" /> Crear mi primera plantilla
                        </Button>
                    }
                />
            </div>
        </div>
    );
}
