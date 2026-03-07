'use client';

import React, { useState, useEffect } from 'react';
import { useBriefTemplates, BriefTemplate } from '@/hooks/use-brief-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2, Plus, Trash2, GripVertical, Save, Check } from 'lucide-react';
import { toast } from 'sonner';

interface BriefBuilderProps {
    template: BriefTemplate;
    onClose: () => void;
}

export function BriefBuilder({ template: initialTemplate, onClose }: BriefBuilderProps) {
    const { updateTemplate } = useBriefTemplates();
    const [template, setTemplate] = useState<BriefTemplate>(initialTemplate);
    const [fields, setFields] = useState<any[]>(initialTemplate.schema || []);
    const [isSaving, setIsSaving] = useState(false);

    const addField = () => {
        setFields([...fields, {
            id: crypto.randomUUID(),
            type: 'text',
            label: 'Nueva pregunta',
            description: '',
            tooltip: '',
            placeholder: '',
            required: true,
            allowOther: false,
            options: []
        }]);
    };

    const updateField = (id: string, updates: any) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Note: The backend expects a PATCH to update, but the hook is configured to use POST currently to /deals/brief-templates/:id (we might need to check if that works, or if the hook needs updating, but we'll use the hook as is).
            const updated = await updateTemplate(template.id, {
                name: template.name,
                description: template.description,
                schema: fields,
                isActive: template.isActive
            });
            if (updated) {
                toast.success('Plantilla guardada correctamente');
            } else {
                toast.error('Error al guardar la plantilla');
            }
        } catch (error) {
            toast.error('Error al guardar la plantilla');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
                <div className="flex-1 max-w-xl">
                    <Input
                        value={template.name}
                        onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                        className="font-bold text-lg border-transparent hover:border-zinc-200 focus-visible:ring-1 bg-transparent px-2 h-9"
                    />
                    <Input
                        value={template.description || ''}
                        onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                        placeholder="Descripción corta de esta plantilla..."
                        className="text-sm text-zinc-500 dark:text-zinc-400 border-transparent hover:border-zinc-200 focus-visible:ring-1 bg-transparent px-2 h-7 mt-1 w-full"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => addField()}>
                        <Plus className="w-4 h-4 mr-2" /> Agregar Campo
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Guardando...' : <><Save className="w-4 h-4 mr-2" /> Guardar Plantilla</>}
                    </Button>
                </div>
            </div>

            {/* Builder Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-50/50 dark:bg-zinc-950/20">
                <div className="max-w-3xl mx-auto space-y-6">
                    {fields.length === 0 ? (
                        <div className="text-center py-16 px-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                            <Settings2 className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">Plantilla vacía</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                                Comienza agregando preguntas o campos que tu cliente deberá llenar.
                            </p>
                            <Button onClick={() => addField()} variant="secondary">
                                <Plus className="w-4 h-4 mr-2" /> Agregar Primer Campo
                            </Button>
                        </div>
                    ) : (
                        fields.map((field, index) => (
                            <div key={field.id} className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">

                                {/* Drag handle & Number */}
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-sm opacity-0 group-hover:opacity-100 cursor-grab text-zinc-400 hover:text-zinc-600 transition-opacity hidden md:flex">
                                    <GripVertical className="w-4 h-4" />
                                </div>

                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-500">
                                            {index + 1}
                                        </span>
                                        <Input
                                            value={field.label}
                                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                                            placeholder="Ej. ¿Cuál es el objetivo principal del proyecto?"
                                            className="font-medium text-base border-transparent hover:border-zinc-200 focus-visible:ring-1 flex-1 shadow-none"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="text-sm border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1.5 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-primary"
                                            value={field.type}
                                            onChange={(e) => updateField(field.id, {
                                                type: e.target.value,
                                                // Reset options if it's not a choice type anymore
                                                options: ['select', 'radio', 'checkbox'].includes(e.target.value) ? field.options : []
                                            })}
                                        >
                                            <option value="text">Texto corto</option>
                                            <option value="textarea">Párrafo (Largo)</option>
                                            <option value="select">Lista Desplegable</option>
                                            <option value="radio">Opciones Únicas (Radio)</option>
                                            <option value="checkbox">Opciones Múltiples</option>
                                        </select>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                            onClick={() => removeField(field.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="pl-8 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-zinc-500">Texto de Ayuda (Placeholder)</Label>
                                            <Input
                                                value={field.placeholder || ''}
                                                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                                placeholder="Ej. Escribe tu respuesta aquí..."
                                                className="text-sm shadow-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-zinc-500">Descripción bajo la pregunta</Label>
                                            <Input
                                                value={field.description || ''}
                                                onChange={(e) => updateField(field.id, { description: e.target.value })}
                                                placeholder="Ej. Selecciona todas las que apliquen"
                                                className="text-sm shadow-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <Label className="text-xs text-zinc-500">Tooltip / Nota de información (vía ícono ℹ️)</Label>
                                            <Input
                                                value={field.tooltip || ''}
                                                onChange={(e) => updateField(field.id, { tooltip: e.target.value })}
                                                placeholder="Ej. Esto nos ayudará a determinar los tiempos de entrega."
                                                className="text-sm shadow-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 pt-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={field.required}
                                                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                                className="rounded border-zinc-300 text-primary focus:ring-primary w-4 h-4"
                                            />
                                            Respuesta Obligatoria
                                        </label>

                                        {['select', 'radio', 'checkbox'].includes(field.type) && (
                                            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={field.allowOther}
                                                    onChange={(e) => updateField(field.id, { allowOther: e.target.checked })}
                                                    className="rounded border-zinc-300 text-primary focus:ring-primary w-4 h-4"
                                                />
                                                Incluir opción "Otro" (con campo de texto)
                                            </label>
                                        )}
                                    </div>

                                    {/* Select Options Manager */}
                                    {['select', 'radio', 'checkbox'].includes(field.type) && (
                                        <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
                                            <Label className="text-xs text-zinc-500 mb-2 block">Opciones</Label>
                                            <div className="space-y-2">
                                                {(field.options || []).map((opt: any, optIdx: number) => (
                                                    <div key={optIdx} className="flex items-center gap-2">
                                                        <Input
                                                            value={opt.label}
                                                            onChange={(e) => {
                                                                const newOpts = [...(field.options || [])];
                                                                newOpts[optIdx] = { label: e.target.value, value: e.target.value };
                                                                updateField(field.id, { options: newOpts });
                                                            }}
                                                            placeholder={`Opción ${optIdx + 1}`}
                                                            className="h-8 shadow-none"
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-zinc-400 hover:text-red-500"
                                                            onClick={() => {
                                                                const newOpts = field.options.filter((_: any, i: number) => i !== optIdx);
                                                                updateField(field.id, { options: newOpts });
                                                            }}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full text-xs h-8 border-dashed"
                                                    onClick={() => {
                                                        const newOpts = [...(field.options || []), { label: '', value: '' }];
                                                        updateField(field.id, { options: newOpts });
                                                    }}
                                                >
                                                    <Plus className="w-3 h-3 mr-1" /> Añadir Opción
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Conditional Logic (Depends On) */}
                                    {index > 0 && (
                                        <div className="pt-2">
                                            <Label className="text-xs text-zinc-500 mb-1.5 block">Lógica Condicional (Opcional)</Label>
                                            <div className="flex flex-col sm:flex-row items-center gap-2">
                                                <span className="text-xs text-zinc-400">Mostrar si</span>
                                                <select
                                                    className="text-xs border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1.5 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-primary flex-1 max-w-[200px]"
                                                    value={field.dependsOn?.fieldId || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (!val) {
                                                            const { dependsOn, ...rest } = field;
                                                            updateField(field.id, rest);
                                                        } else {
                                                            updateField(field.id, { dependsOn: { fieldId: val, value: field.dependsOn?.value || '' } });
                                                        }
                                                    }}
                                                >
                                                    <option value="">-- Siempre visible --</option>
                                                    {fields.slice(0, index)
                                                        .filter(f => ['select', 'radio', 'checkbox'].includes(f.type))
                                                        .map(prevF => (
                                                            <option key={prevF.id} value={prevF.id}>{prevF.label || 'Pregunta sin nombre'}</option>
                                                        ))
                                                    }
                                                </select>

                                                {field.dependsOn?.fieldId && (
                                                    <>
                                                        <span className="text-xs text-zinc-400">es igual a</span>
                                                        <select
                                                            className="text-xs border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1.5 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-primary flex-1 max-w-[200px]"
                                                            value={field.dependsOn?.value || ''}
                                                            onChange={(e) => updateField(field.id, { dependsOn: { ...field.dependsOn, value: e.target.value } })}
                                                        >
                                                            <option value="">Selecciona opción...</option>
                                                            {(fields.find(f => f.id === field.dependsOn?.fieldId)?.options || []).map((opt: any, idx: number) => (
                                                                <option key={idx} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                            {/* Allow depending on 'Otro' if enabled */}
                                                            {fields.find(f => f.id === field.dependsOn?.fieldId)?.allowOther && (
                                                                <option value="__other__">La opción "Otro"</option>
                                                            )}
                                                        </select>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// Simple internal icon for options manager
function X({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
}
