'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { portalApi, PortalDealDetail, PortalAsset } from '@/features/portal/api';
import { getImageUrl, cn } from '@/lib/utils';
import {
    ArrowLeft, CheckCircle2, Clock, FileText, CreditCard, Upload,
    Loader2, AlertCircle, ExternalLink, File, FileImage, FileVideo,
    FileArchive, Sparkles, ShieldCheck, Calendar, ChevronDown, Star,
    FolderOpen, HardDrive, Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type DealStage = 'brief' | 'proposal' | 'waiting' | 'approved' | 'in_progress' | 'completed';

function resolveDealStage(deal: PortalDealDetail): DealStage {
    const briefExists = !!deal.brief;
    const briefDone = deal.brief?.isCompleted ?? true;
    const hasQ = (deal.quotations?.length ?? 0) > 0;
    const isApproved = deal.quotations?.some((q) => q.isApproved) ?? false;
    const projectStatus = deal.project?.status;

    if (briefExists && !briefDone) return 'brief';
    if (projectStatus === 'completed') return 'completed';
    if (projectStatus === 'active') return 'in_progress';
    if (isApproved) return 'approved';
    if (hasQ) return 'proposal';
    return 'waiting';
}

const STEPS: { key: DealStage; label: string }[] = [
    { key: 'brief', label: 'Brief' },
    { key: 'proposal', label: 'Propuesta' },
    { key: 'approved', label: 'Aprobado' },
    { key: 'in_progress', label: 'En progreso' },
    { key: 'completed', label: 'Finalizado' },
];

function getStepIndex(stage: DealStage): number {
    // Map 'waiting' to proposal step
    const s = stage === 'waiting' ? 'proposal' : stage;
    return STEPS.findIndex((x) => x.key === s);
}

const CURRENCY_FALLBACKS: Record<string, string> = {
    GTQ: 'Q', USD: '$', EUR: '€', MXN: '$', GBP: '£', CAD: '$',
    AUD: '$', BRL: 'R$', COP: '$', ARS: '$', PEN: 'S/',
};

function getSymbol(deal: PortalDealDetail, q?: { currency?: string | null }): string {
    if (q?.currency) return CURRENCY_FALLBACKS[q.currency] ?? q.currency;
    return deal.currency?.symbol ?? '$';
}

function fmt(n: number, sym: string): string {
    return `${sym}${Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
}

function fmtDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtBytes(bytes?: string): string {
    const n = parseInt(bytes ?? '0', 10);
    if (!n) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function AssetFileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
    if (mimeType.startsWith('image/')) return <FileImage className={className} />;
    if (mimeType.startsWith('video/')) return <FileVideo className={className} />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <FileArchive className={className} />;
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet'))
        return <FileText className={className} />;
    return <File className={className} />;
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ stage }: { stage: DealStage }) {
    const currentIdx = getStepIndex(stage);

    return (
        <div className="flex items-center gap-0">
            {STEPS.map((step, idx) => {
                const done = idx < currentIdx;
                const active = idx === currentIdx;
                return (
                    <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center gap-1.5">
                            <div className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all',
                                done
                                    ? 'border-emerald-500 bg-emerald-500'
                                    : active
                                        ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white'
                                        : 'border-zinc-300 dark:border-zinc-700 bg-transparent',
                            )}>
                                {done ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                ) : (
                                    <span className={cn(
                                        'text-[10px] font-bold',
                                        active ? 'text-white dark:text-zinc-900' : 'text-zinc-400 dark:text-zinc-600',
                                    )}>{idx + 1}</span>
                                )}
                            </div>
                            <span className={cn(
                                'text-[10px] font-medium whitespace-nowrap',
                                active ? 'text-zinc-900 dark:text-white' : done ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-600',
                            )}>{step.label}</span>
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div className={cn(
                                'h-[2px] flex-1 mx-1 mb-4 rounded-full transition-all',
                                idx < currentIdx ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800',
                            )} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ─── Brief inline form ────────────────────────────────────────────────────────

type BriefOption = string | { label: string; value: string };
function optLabel(o: BriefOption) { return typeof o === 'string' ? o : o.label; }
function optValue(o: BriefOption) { return typeof o === 'string' ? o : o.value; }

const inputCls = 'w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-all';

function BriefForm({ deal, onSubmitted }: { deal: PortalDealDetail; onSubmitted: () => void }) {
    const schema = deal.brief?.template?.schema ?? [];
    const [responses, setResponses] = useState<Record<string, string | string[] | number>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    type SchemaField = NonNullable<NonNullable<PortalDealDetail['brief']>['template']>['schema'][number];
    const isVisible = (field: SchemaField) => {
        if (!field.dependsOn) return true;
        const val = responses[field.dependsOn.fieldId];
        if (Array.isArray(val)) return val.includes(field.dependsOn.value);
        return val === field.dependsOn.value;
    };

    const setResponse = (id: string, val: string | string[] | number) => {
        setResponses((r) => ({ ...r, [id]: val }));
        setErrors((e) => { const n = { ...e }; delete n[id]; return n; });
    };

    const toggleCheckbox = (id: string, opt: string) => {
        const cur = (responses[id] as string[]) || [];
        setResponse(id, cur.includes(opt) ? cur.filter((v) => v !== opt) : [...cur, opt]);
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        schema.filter(isVisible).forEach((f) => {
            if (!f.required) return;
            const val = responses[f.id];
            if (val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) {
                errs[f.id] = 'Este campo es requerido';
            }
        });
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const briefToken = deal.brief!.publicToken;
            const res = await fetch(`${API_URL}/public/briefs/${briefToken}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(responses),
            });
            if (!res.ok) throw new Error();
            onSubmitted();
        } catch {
            setSubmitError('No se pudo enviar el brief. Inténtalo de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (schema.length === 0) {
        return (
            <p className="text-sm text-zinc-500">No hay campos en este cuestionario.</p>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {schema.filter(isVisible).map((field) => (
                <div key={field.id} className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.description && <p className="text-xs text-zinc-500">{field.description}</p>}

                    {field.type === 'text' && (
                        <input className={inputCls} value={(responses[field.id] as string) || ''}
                            onChange={(e) => setResponse(field.id, e.target.value)} placeholder="Tu respuesta..." />
                    )}
                    {field.type === 'textarea' && (
                        <textarea className={inputCls + ' h-24 resize-none'} value={(responses[field.id] as string) || ''}
                            onChange={(e) => setResponse(field.id, e.target.value)} placeholder="Tu respuesta..." />
                    )}
                    {field.type === 'select' && (
                        <div className="relative">
                            <select className={inputCls + ' appearance-none pr-10 cursor-pointer'}
                                value={(responses[field.id] as string) || ''}
                                onChange={(e) => setResponse(field.id, e.target.value)}>
                                <option value="">Selecciona una opción</option>
                                {field.options?.map((opt) => (
                                    <option key={optValue(opt)} value={optValue(opt)}>{optLabel(opt)}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                        </div>
                    )}
                    {field.type === 'radio' && (
                        <div className="space-y-2">
                            {field.options?.map((opt) => (
                                <label key={optValue(opt)} className="flex items-center gap-3 cursor-pointer">
                                    <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center',
                                        responses[field.id] === optValue(opt)
                                            ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white'
                                            : 'border-zinc-300 dark:border-zinc-600',
                                    )}>
                                        {responses[field.id] === optValue(opt) && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-zinc-900" />
                                        )}
                                    </div>
                                    <input type="radio" className="sr-only" checked={responses[field.id] === optValue(opt)}
                                        onChange={() => setResponse(field.id, optValue(opt))} />
                                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{optLabel(opt)}</span>
                                </label>
                            ))}
                        </div>
                    )}
                    {field.type === 'checkbox' && (
                        <div className="space-y-2">
                            {field.options?.map((opt) => {
                                const val = optValue(opt);
                                const checked = ((responses[field.id] as string[]) || []).includes(val);
                                return (
                                    <label key={val} className="flex items-center gap-3 cursor-pointer">
                                        <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center',
                                            checked ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white' : 'border-zinc-300 dark:border-zinc-600',
                                        )}>
                                            {checked && <svg className="w-2.5 h-2.5 text-white dark:text-zinc-900" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                        </div>
                                        <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleCheckbox(field.id, val)} />
                                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{optLabel(opt)}</span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                    {field.type === 'rating' && (
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button key={n} type="button" onClick={() => setResponse(field.id, n)}>
                                    <Star className={cn('w-7 h-7 transition-colors', Number(responses[field.id]) >= n ? 'text-amber-400 fill-amber-400' : 'text-zinc-300 dark:text-zinc-600')} />
                                </button>
                            ))}
                        </div>
                    )}

                    {errors[field.id] && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> {errors[field.id]}
                        </p>
                    )}
                </div>
            ))}

            {submitError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/[0.07] border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-500">{submitError}</p>
                </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11">
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando...</> : 'Enviar cuestionario'}
            </Button>
        </form>
    );
}

// ─── Assets section ───────────────────────────────────────────────────────────

function AssetsSection({ token, hasDriveFolder }: { token: string; hasDriveFolder: boolean }) {
    const [assets, setAssets] = useState<PortalAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        portalApi.getAssets(token)
            .then(setAssets)
            .catch(() => {/* silent */})
            .finally(() => setIsLoading(false));
    }, [token]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const uploaded = await portalApi.uploadAsset(token, file);
            setAssets((prev) => [uploaded, ...prev]);
            toast.success('Archivo subido correctamente');
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            toast.error(apiErr.response?.data?.message || 'No se pudo subir el archivo');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Archivos del proyecto</span>
                    {assets.length > 0 && (
                        <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full px-2 py-0.5">{assets.length}</span>
                    )}
                </div>
                {hasDriveFolder && (
                    <div>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
                        <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full gap-1.5 h-8 text-xs"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                            Subir archivo
                        </Button>
                    </div>
                )}
            </div>

            {!hasDriveFolder && (
                <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <FolderOpen className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">La carpeta del proyecto aún no ha sido configurada.</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Tu freelancer habilitará los archivos cuando comience el proyecto.</p>
                    </div>
                </div>
            )}

            {hasDriveFolder && isLoading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                </div>
            )}

            {hasDriveFolder && !isLoading && assets.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    <FolderOpen className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-3" />
                    <p className="text-sm text-zinc-500">Sin archivos todavía</p>
                    <p className="text-xs text-zinc-400 mt-1">Sube archivos relevantes para tu proyecto.</p>
                    <Button size="sm" variant="outline" className="mt-4 rounded-full gap-1.5 h-8 text-xs"
                        onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        <Upload className="h-3 w-3" /> Subir primer archivo
                    </Button>
                </div>
            )}

            {hasDriveFolder && assets.length > 0 && (
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    {assets.map((asset, idx) => (
                        <div key={asset.id}
                            className={cn('flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors',
                                idx < assets.length - 1 && 'border-b border-zinc-100 dark:border-zinc-800',
                            )}>
                            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                <AssetFileIcon mimeType={asset.mimeType} className="h-4 w-4 text-zinc-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{asset.name}</p>
                                <p className="text-xs text-zinc-400">{fmtBytes(asset.size)} · {fmtDate(asset.createdTime)}</p>
                            </div>
                            <a href={asset.webViewLink} target="_blank" rel="noopener noreferrer"
                                className="shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-1">
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Quotation detail ─────────────────────────────────────────────────────────

function QuotationDetail({ deal, q }: { deal: PortalDealDetail; q: NonNullable<PortalDealDetail['quotations']>[number] }) {
    const sym = getSymbol(deal, q);
    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                    <p className="text-base font-semibold">{q.optionName}</p>
                    {q.description && <p className="text-sm text-zinc-500 mt-0.5">{q.description}</p>}
                </div>
                <div className="sm:text-right">
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-0.5">Total</p>
                    <p className="text-3xl font-black tracking-tight">{fmt(q.total, sym)}</p>
                </div>
            </div>

            {q.items && q.items.length > 0 && (
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    {q.items.map((item, idx) => (
                        <div key={item.id} className={cn(
                            'flex items-center justify-between px-4 py-3 gap-3',
                            idx < q.items.length - 1 && 'border-b border-zinc-100 dark:border-zinc-800',
                        )}>
                            <div className="min-w-0">
                                <p className="text-sm font-medium">{item.name}</p>
                                {item.description && <p className="text-xs text-zinc-400 truncate">{item.description}</p>}
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                                <span className="text-xs text-zinc-400">{item.quantity} × {fmt(item.price, sym)}</span>
                                <span className="text-sm font-semibold">{fmt(item.subtotal, sym)}</span>
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-end px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                        <div className="space-y-1 text-right">
                            {q.discount > 0 && (
                                <div className="flex gap-8 text-sm">
                                    <span className="text-zinc-400">Descuento</span>
                                    <span className="text-zinc-600">−{fmt(q.discount, sym)}</span>
                                </div>
                            )}
                            <div className="flex gap-8 text-sm font-bold">
                                <span className="text-zinc-500">Total</span>
                                <span>{fmt(q.total, sym)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Payment milestones ───────────────────────────────────────────────────────

function MilestoneStatus({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string }> = {
        PAID: { label: 'Pagado', cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
        PENDING: { label: 'Pendiente', cls: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700' },
        OVERDUE: { label: 'Vencido', cls: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
        CANCELLED: { label: 'Cancelado', cls: 'text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700' },
    };
    const m = map[status] ?? map.PENDING;
    return (
        <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full border', m.cls)}>{m.label}</span>
    );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {icon}
                {title}
            </h2>
            {children}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function DealDetailContent() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [deal, setDeal] = useState<PortalDealDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [briefSubmitted, setBriefSubmitted] = useState(false);
    const [activeQuotationId, setActiveQuotationId] = useState<string | null>(null);
    const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);
    const [isApproving, setIsApproving] = useState(false);

    useEffect(() => {
        portalApi.getDeal(token)
            .then((data) => {
                setDeal(data);
                const approved = data.quotations?.find((q) => q.isApproved);
                setActiveQuotationId(approved?.id ?? data.quotations?.[0]?.id ?? null);
            })
            .catch(() => setError('No se pudo cargar el proyecto.'))
            .finally(() => setIsLoading(false));
    }, [token]);

    const handleBriefSubmitted = () => {
        setBriefSubmitted(true);
        setDeal((prev) => prev ? { ...prev, brief: { ...prev.brief!, isCompleted: true } } : prev);
    };

    const handleApprove = async (quotationId: string) => {
        if (!deal || isApproving) return;
        setIsApproving(true);
        try {
            await fetch(`${API_URL}/public/deals/${deal.publicToken}/approve-quotation/${quotationId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            setDeal((prev) => prev ? {
                ...prev,
                quotations: prev.quotations?.map((q) => ({ ...q, isApproved: q.id === quotationId })),
            } : prev);
            setConfirmApproveId(null);
            toast.success('¡Propuesta aprobada!');
        } catch {
            toast.error('No se pudo aprobar la propuesta. Intenta de nuevo.');
        } finally {
            setIsApproving(false);
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center py-32">
            <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
        </div>
    );

    if (error || !deal) return (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500">{error ?? 'Proyecto no encontrado'}</p>
            <Button variant="outline" className="rounded-full" onClick={() => router.push('/portal')}>
                Volver al portal
            </Button>
        </div>
    );

    const stage = briefSubmitted ? (deal.quotations?.some((q) => q.isApproved) ? 'approved' : 'waiting') as DealStage : resolveDealStage(deal);
    const logo = deal.workspace.logo ? getImageUrl(deal.workspace.logo) : null;
    const workspaceName = deal.workspace.businessName || 'Freelancer';
    const quotations = deal.quotations ?? [];
    const approvedQ = quotations.find((q) => q.isApproved);
    const activeQ = quotations.find((q) => q.id === activeQuotationId) ?? quotations[0];
    const sym = getSymbol(deal, activeQ);
    const hasDriveFolder = !!deal.project?.driveFolderId;
    const projectExists = !!deal.project;

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
            {/* Back + header */}
            <div>
                <button onClick={() => router.push('/portal')}
                    className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-5">
                    <ArrowLeft className="h-4 w-4" /> Volver al portal
                </button>

                {/* Workspace branding */}
                <div className="flex items-center gap-3 mb-6">
                    {logo ? (
                        <Image src={logo} alt={workspaceName} width={44} height={44}
                            className="rounded-xl object-contain border border-zinc-100 dark:border-zinc-800" />
                    ) : (
                        <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <span className="text-sm font-bold text-zinc-500">{workspaceName.charAt(0)}</span>
                        </div>
                    )}
                    <div>
                        <p className="text-xs text-zinc-400">Proyecto de</p>
                        <p className="font-semibold">{workspaceName}</p>
                    </div>
                </div>

                {/* Stepper */}
                <Stepper stage={stage} />
            </div>

            {/* Brief */}
            {deal.brief && (
                <Section title={briefSubmitted || deal.brief.isCompleted ? 'Brief completado' : 'Completa tu brief'} icon={<FileText className="h-4 w-4" />}>
                    {briefSubmitted || deal.brief.isCompleted ? (
                        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            Cuestionario enviado. Estamos preparando tu propuesta.
                        </div>
                    ) : (
                        <BriefForm deal={deal} onSubmitted={handleBriefSubmitted} />
                    )}
                </Section>
            )}

            {/* Proposal intro */}
            {deal.proposalIntro && (
                <Section title="Carta de presentación" icon={<Sparkles className="h-4 w-4" />}>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">{deal.proposalIntro}</p>
                </Section>
            )}

            {/* Quotation */}
            {quotations.length > 0 && (
                <Section title="Cotización" icon={<CreditCard className="h-4 w-4" />}>
                    {/* Tabs for multiple options */}
                    {quotations.length > 1 && (
                        <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-fit mb-2">
                            {quotations.map((q) => (
                                <button key={q.id} onClick={() => setActiveQuotationId(q.id)}
                                    className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                                        activeQuotationId === q.id
                                            ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white'
                                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300',
                                    )}>
                                    {q.optionName}
                                    {q.isApproved && <CheckCircle2 className="inline h-3 w-3 ml-1 text-emerald-500" />}
                                </button>
                            ))}
                        </div>
                    )}

                    {activeQ && <QuotationDetail deal={deal} q={activeQ} />}

                    {/* Approve button — only show if not yet approved */}
                    {!approvedQ && activeQ && (stage === 'proposal') && (
                        <Button onClick={() => setConfirmApproveId(activeQ.id)} className="w-full rounded-xl h-11">
                            {quotations.length === 1 ? 'Aprobar propuesta' : `Aprobar: ${activeQ.optionName}`}
                        </Button>
                    )}

                    {approvedQ && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                                Aprobaste <strong>{approvedQ.optionName}</strong> — {fmt(approvedQ.total, getSymbol(deal, approvedQ))}
                            </p>
                        </div>
                    )}
                </Section>
            )}

            {/* Waiting */}
            {quotations.length === 0 && !deal.brief?.isCompleted === false && (
                <Section title="En preparación" icon={<Clock className="h-4 w-4" />}>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Clock className="h-4 w-4 text-blue-500" />
                        Tu propuesta está siendo preparada. Te avisaremos cuando esté lista.
                    </div>
                </Section>
            )}

            {/* Payment plan */}
            {deal.paymentPlan && deal.paymentPlan.milestones.length > 0 && (
                <Section title="Plan de pagos" icon={<CreditCard className="h-4 w-4" />}>
                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        {deal.paymentPlan.milestones.map((m, idx) => (
                            <div key={m.id} className={cn(
                                'flex items-center justify-between px-4 py-4 gap-3',
                                idx < deal.paymentPlan!.milestones.length - 1 && 'border-b border-zinc-100 dark:border-zinc-800',
                            )}>
                                <div className="flex items-start gap-3 min-w-0">
                                    <span className="text-xs font-bold text-zinc-400 pt-0.5 w-4 shrink-0">{idx + 1}.</span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium">{m.name}</p>
                                        {m.dueDate && (
                                            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" /> {fmtDate(m.dueDate)}
                                            </p>
                                        )}
                                        {m.description && <p className="text-xs text-zinc-400 mt-0.5">{m.description}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right">
                                        <p className="text-sm font-bold">{fmt(m.amount, sym)}</p>
                                        {m.percentage && <p className="text-[11px] text-zinc-400">{m.percentage}%</p>}
                                    </div>
                                    <MilestoneStatus status={m.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* Assets — only show if project exists */}
            {projectExists && (
                <Section title="Archivos del proyecto" icon={<Package className="h-4 w-4" />}>
                    <AssetsSection token={token} hasDriveFolder={hasDriveFolder} />
                </Section>
            )}

            {/* Terms */}
            {deal.proposalTerms && (
                <Section title="Términos y condiciones" icon={<ShieldCheck className="h-4 w-4" />}>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">{deal.proposalTerms}</p>
                </Section>
            )}

            {/* Valid until */}
            {deal.validUntil && !approvedQ && (
                <p className="text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5">
                    <Clock className="h-3 w-3" /> Válida hasta {fmtDate(deal.validUntil)}
                </p>
            )}

            {/* Confirm approve modal */}
            {confirmApproveId && (() => {
                const q = quotations.find((x) => x.id === confirmApproveId);
                if (!q) return null;
                return (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">
                        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-2xl">
                            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-5">
                                <Sparkles className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
                            </div>
                            <h2 className="text-xl font-bold text-center mb-1">Confirmar selección</h2>
                            <p className="text-sm text-zinc-500 text-center mb-2">
                                <strong className="text-zinc-700 dark:text-zinc-300">{q.optionName}</strong>
                            </p>
                            <p className="text-3xl font-black text-center my-5">
                                {fmt(q.total, getSymbol(deal, q))}
                            </p>
                            <p className="text-xs text-zinc-400 text-center mb-6">
                                Al confirmar notificaremos al equipo para comenzar el proyecto.
                            </p>
                            <div className="flex flex-col gap-2">
                                <Button onClick={() => handleApprove(confirmApproveId)} disabled={isApproving} className="w-full rounded-xl h-11">
                                    {isApproving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Confirmar y aprobar
                                </Button>
                                <Button variant="ghost" onClick={() => setConfirmApproveId(null)} className="w-full rounded-xl h-10 text-zinc-500">
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

export default function PortalDealDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-32">
                <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
            </div>
        }>
            <DealDetailContent />
        </Suspense>
    );
}
