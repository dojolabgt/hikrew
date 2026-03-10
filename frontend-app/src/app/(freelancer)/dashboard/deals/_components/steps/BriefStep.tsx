'use client';

import React, { useEffect, useState } from 'react';
import { useBriefTemplates } from '@/hooks/use-brief-templates';
import { Button } from '@/components/ui/button';
import {
    Plus,
    FileText,
    ArrowRight,
    CheckCircle2,
    XCircle,
    Pencil,
    AlignLeft,
    AlignJustify,
    ChevronDown,
    Circle,
    CheckSquare,
    Star,
    Info,
    AlertCircle,
    Copy,
} from 'lucide-react';
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
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface BriefStepProps {
    initialSelectedTemplateId?: string | null;
    publicToken?: string | null;
    isCompleted?: boolean;
    responses?: Record<string, any>;
    onSelectTemplate?: (id: string | null) => void;
}

// ── Field type helpers ─────────────────────────────────────────────────────

const FIELD_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; mockPreview: React.ReactNode }> = {
    text: {
        label: 'Texto corto',
        icon: <AlignLeft className="w-3.5 h-3.5" />,
        color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        mockPreview: (
            <div className="mt-2 h-9 rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex items-center px-3 text-xs text-zinc-400 dark:text-zinc-500 italic">
                Tu respuesta aquí...
            </div>
        ),
    },
    textarea: {
        label: 'Párrafo',
        icon: <AlignJustify className="w-3.5 h-3.5" />,
        color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        mockPreview: (
            <div className="mt-2 h-20 rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex items-start px-3 pt-2 text-xs text-zinc-400 dark:text-zinc-500 italic">
                Escribe tu respuesta detallada aquí...
            </div>
        ),
    },
    select: {
        label: 'Lista desplegable',
        icon: <ChevronDown className="w-3.5 h-3.5" />,
        color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        mockPreview: (
            <div className="mt-2 h-9 rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex items-center px-3 text-xs text-zinc-400 dark:text-zinc-500 italic justify-between">
                Selecciona una opción...
                <ChevronDown className="w-3.5 h-3.5" />
            </div>
        ),
    },
    radio: {
        label: 'Opción única',
        icon: <Circle className="w-3.5 h-3.5" />,
        color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        mockPreview: null, // rendered dynamically below
    },
    checkbox: {
        label: 'Múltiple selección',
        icon: <CheckSquare className="w-3.5 h-3.5" />,
        color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
        mockPreview: null, // rendered dynamically below
    },
    rating: {
        label: 'Calificación',
        icon: <Star className="w-3.5 h-3.5" />,
        color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        mockPreview: (
            <div className="mt-2 flex gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                ))}
            </div>
        ),
    },
};

function FieldMockPreview({ field }: { field: any }) {
    const config = FIELD_TYPE_CONFIG[field.type];
    if (!config) return null;

    if (['radio', 'checkbox'].includes(field.type) && field.options?.length > 0) {
        return (
            <div className="mt-2 space-y-1.5">
                {field.options.slice(0, 3).map((opt: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <div className={`w-3.5 h-3.5 flex-shrink-0 border border-zinc-300 dark:border-zinc-600 ${field.type === 'radio' ? 'rounded-full' : 'rounded'} bg-zinc-50 dark:bg-zinc-900`} />
                        <span>{opt.label || opt}</span>
                    </div>
                ))}
                {field.options.length > 3 && (
                    <p className="text-[10px] text-zinc-400 pl-5">+{field.options.length - 3} más...</p>
                )}
                {field.allowOther && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 italic">
                        <div className={`w-3.5 h-3.5 flex-shrink-0 border border-dashed border-zinc-300 dark:border-zinc-600 ${field.type === 'radio' ? 'rounded-full' : 'rounded'}`} />
                        <span>Otro (especifica)</span>
                    </div>
                )}
            </div>
        );
    }

    return config.mockPreview;
}

export function BriefStep({ initialSelectedTemplateId, publicToken, isCompleted, responses = {}, onSelectTemplate }: BriefStepProps) {
    const router = useRouter();
    const { templates, fetchTemplates, isLoading } = useBriefTemplates();
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(initialSelectedTemplateId || null);
    // Fix 1.4 — gate for the "Cambiar" destructive confirmation
    const [showChangeBriefDialog, setShowChangeBriefDialog] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleSelect = (tpl: { id: string; isActive?: boolean }) => {
        if (!tpl.isActive) return;
        setSelectedTemplate(tpl.id);
        if (onSelectTemplate) onSelectTemplate(tpl.id);
        toast.success(`Brief seleccionado`);
    };

    // Fix 1.4 — only show dialog when a brief is already linked or already completed
    const handleBack = () => {
        if (selectedTemplate) {
            setShowChangeBriefDialog(true);
        } else {
            setSelectedTemplate(null);
            if (onSelectTemplate) onSelectTemplate(null);
        }
    };

    const confirmChangeBrief = () => {
        setSelectedTemplate(null);
        if (onSelectTemplate) onSelectTemplate(null);
        setShowChangeBriefDialog(false);
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

                {/* Template table — Fix 1.5: clicking any row selects the template */}
                <DataTable
                    data={templates}
                    columns={columns}
                    isLoading={isLoading}
                    emptyIcon={<FileText className="w-8 h-8" />}
                    emptyTitle="No tienes plantillas creadas"
                    emptyDescription="Acelera tus ventas teniendo formatos de cuestionarios listos para enviar. Dirígete a Ajustes para crear tu primera plantilla."
                    onRowClick={(tpl) => handleSelect(tpl)}
                />
            </div>
        );
    }

    // ── Template preview view (Redesigned — Document style) ────────────────

    const tpl = templates.find(t => t.id === selectedTemplate);
    const schema: any[] = tpl?.schema || [];

    return (
        <div className="space-y-6">
            {/* ENLACE PÚBLICO BANNER */}
            {publicToken && (
                <div className={`p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border ${isCompleted ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 'bg-primary/5 border-primary/20'}`}>
                    <div>
                        <h4 className={`text-sm font-semibold flex items-center gap-2 ${isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-primary'}`}>
                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                            {isCompleted ? 'Brief Completado' : 'Enlace público para tu cliente'}
                        </h4>
                        <p className={`text-xs mt-1 max-w-xl ${isCompleted ? 'text-emerald-600 dark:text-emerald-500' : 'text-zinc-600 dark:text-zinc-400'}`}>
                            {isCompleted
                                ? 'El cliente ya ha llenado este cuestionario exitosamente y sus respuestas fueron guardadas.'
                                : 'Copia y envía este enlace seguro a tu cliente. Podrá llenar el Brief sin necesidad de crear una cuenta en Blend.'}
                        </p>
                    </div>
                    {!isCompleted && (() => {
                        const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_PUBLIC_URL
                            || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : '');
                        const fullPublicLink = `${baseUrl}/b/${publicToken}`;

                        return (
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 px-3 py-2 rounded-lg truncate max-w-[200px] select-all hidden sm:block">
                                    {fullPublicLink || `.../b/${publicToken}`}
                                </div>
                                <Button
                                    size="sm"
                                    className="shrink-0 shadow-sm"
                                    onClick={() => {
                                        if (fullPublicLink) navigator.clipboard.writeText(fullPublicLink);
                                        toast.success('¡Enlace copiado al portapapeles!');
                                    }}
                                >
                                    <Copy className="w-4 h-4 mr-2" /> Copiar enlace
                                </Button>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Header Bar */}
            <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">Brief Seleccionado</p>
                        <h3 className="font-semibold text-zinc-900 dark:text-white truncate text-sm mt-0.5">
                            {tpl?.name || 'Plantilla'}
                        </h3>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {/* Fix 1.4 — AlertDialog confirmation */}
                    <AlertDialog open={showChangeBriefDialog} onOpenChange={setShowChangeBriefDialog}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Cambiar la plantilla de Brief?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {isCompleted
                                        ? 'El cliente ya completó este brief. Cambiar la plantilla no eliminará las respuestas guardadas, pero desvincularás el cuestionario actual de esta propuesta.'
                                        : 'Si cambias la plantilla, el enlace público actual del brief dejará de estar asociado a esta propuesta.'}
                                    {' '}¿Deseas continuar?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmChangeBrief}>
                                    Sí, cambiar plantilla
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-zinc-500"
                        onClick={handleBack}
                    >
                        Cambiar
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5"
                        onClick={() => router.push(`/dashboard/templates/briefs?edit=${selectedTemplate}`)}
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar plantilla
                    </Button>
                </div>
            </div>

            {/* UX Warning para cambios externos */}
            {!isCompleted && (
                <div className="flex items-start gap-2 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-300">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>
                        Si editas esta plantilla, los cambios <span className="font-semibold">no se aplicarán automáticamente</span> a esta propuesta.
                        Para refrescar el formulario, haz clic en <strong>Cambiar</strong> y vuelve a seleccionarla.
                    </p>
                </div>
            )}

            {/* Fields — Document style */}
            {schema.length === 0 ? (
                <div className="h-48 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-400 gap-2">
                    <AlertCircle className="w-8 h-8 opacity-40" />
                    <p className="text-sm">Este brief no tiene preguntas todavía.</p>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs mt-1"
                        onClick={() => router.push(`/dashboard/templates/briefs?edit=${selectedTemplate}`)}
                    >
                        <Pencil className="w-3.5 h-3.5 mr-1.5" /> Ir a editar
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {schema.map((field, idx) => {
                        const config = FIELD_TYPE_CONFIG[field.type] || FIELD_TYPE_CONFIG['text'];
                        return (
                            <div
                                key={field.id}
                                className="group bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 transition-shadow hover:shadow-sm"
                            >
                                {/* Question header */}
                                <div className="flex items-start justify-between gap-3 mb-1">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        {/* Number badge */}
                                        <span className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-zinc-900 dark:text-white text-sm leading-snug">
                                                {field.label || 'Sin pregunta asignada'}
                                                {field.required && (
                                                    <span className="text-red-500 ml-1">*</span>
                                                )}
                                            </p>
                                            {field.description && (
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                    {field.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Field type badge */}
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${config.color}`}>
                                        {config.icon}
                                        {config.label}
                                    </span>
                                </div>

                                {/* Tooltip */}
                                {field.tooltip && (
                                    <div className="flex items-center gap-1.5 ml-9 mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                                        <Info className="w-3 h-3 flex-shrink-0" />
                                        <span>{field.tooltip}</span>
                                    </div>
                                )}

                                {/* Answer / Mock preview */}
                                <div className="ml-9 mt-2">
                                    {isCompleted ? (
                                        <div className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-zinc-100">
                                            {responses[field.id] !== undefined && responses[field.id] !== '' ? (
                                                Array.isArray(responses[field.id]) ? (
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        {responses[field.id].map((ans: string, i: number) => <li key={i}>{ans}</li>)}
                                                    </ul>
                                                ) : (
                                                    <p className="whitespace-pre-wrap">{String(responses[field.id])}</p>
                                                )
                                            ) : (
                                                <span className="text-zinc-400 italic">No respondió</span>
                                            )}
                                        </div>
                                    ) : (
                                        <FieldMockPreview field={field} />
                                    )}
                                </div>

                                {/* Conditional logic hint */}
                                {field.dependsOn?.fieldId && (
                                    <div className="ml-9 mt-3 inline-flex items-center gap-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full">
                                        <AlertCircle className="w-3 h-3" />
                                        Visible condicionalmente
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Summary footer */}
                    <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 px-1 pt-1">
                        <span>{schema.length} pregunta{schema.length !== 1 ? 's' : ''} en total</span>
                        <span>{schema.filter(f => f.required).length} obligatoria{schema.filter(f => f.required).length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
