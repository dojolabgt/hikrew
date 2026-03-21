'use client';

import React, { useEffect, useState, use, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    CheckCircle2, Clock, AlertCircle, Loader2, Lock,
    CalendarDays, CreditCard, FileText, Sparkles, ArrowRight,
    ChevronDown, ClipboardList, ChevronUp, Send,
} from 'lucide-react';
import {
    publicDealsApi,
    PublicDealData, PublicDealQuotation,
    BriefField, BriefResponses,
} from '@/features/deals/publicApi';
import { getImageUrl, cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CURRENCY_FALLBACKS: Record<string, string> = {
    GTQ: 'Q', USD: '$', EUR: '€', MXN: '$', GBP: '£', JPY: '¥',
    CAD: '$', AUD: '$', CHF: 'Fr', BRL: 'R$', COP: '$', ARS: '$',
    PEN: 'S/', CLP: '$', CRC: '₡', HNL: 'L', NIO: 'C$', DOP: 'RD$',
};

function getCurrencySymbol(deal: PublicDealData, quotation?: PublicDealQuotation) {
    if (quotation?.currency) return CURRENCY_FALLBACKS[quotation.currency] ?? quotation.currency;
    return deal.currency?.symbol ?? '$';
}

function fmt(val: number, symbol: string) {
    return `${symbol}${Number(val).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
}

function formatDate(iso?: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isExpired(validUntil?: string) {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skel({ className }: { className?: string }) {
    return <div className={cn('animate-pulse rounded-xl bg-zinc-100 dark:bg-white/[0.06]', className)} />;
}

function PageSkeleton() {
    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#0d0d0d]">
            <div className="h-14 border-b border-zinc-200 dark:border-white/[0.07] bg-white dark:bg-[#111] px-6 flex items-center gap-3">
                <Skel className="w-8 h-8 rounded-xl" />
                <Skel className="w-36 h-4" />
            </div>
            <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
                <Skel className="w-52 h-8" />
                <Skel className="w-full h-16 rounded-2xl" />
                <Skel className="w-full h-72 rounded-2xl" />
                <Skel className="w-full h-48 rounded-2xl" />
            </div>
        </div>
    );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function PageHeader({
    workspace,
    status,
    validUntil,
    brandColor,
}: {
    workspace: PublicDealData['workspace'];
    status?: string;
    validUntil?: string;
    brandColor: string;
}) {
    const expired = isExpired(validUntil);
    const statusMap: Record<string, { label: string; cls: string }> = {
        DRAFT:       { label: 'Borrador',       cls: 'bg-zinc-100 dark:bg-white/[0.07] text-zinc-500 dark:text-white/45' },
        SENT:        { label: 'Enviado',         cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
        VIEWED:      { label: 'Visto',           cls: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400' },
        NEGOTIATING: { label: 'En negociación',  cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
        WON:         { label: 'Aprobado',        cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' },
        LOST:        { label: 'Cerrado',         cls: 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400' },
    };
    const s = statusMap[status ?? ''];

    return (
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#111]/90 backdrop-blur-xl border-b border-zinc-200/80 dark:border-white/[0.06]">
            <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    {workspace.logo ? (
                        <Image
                            src={getImageUrl(workspace.logo) ?? ''}
                            alt={workspace.businessName ?? 'Logo'}
                            width={28}
                            height={28}
                            className="object-contain rounded-lg"
                        />
                    ) : (
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                            style={{ backgroundColor: brandColor }}
                        >
                            {(workspace.businessName ?? '?')[0].toUpperCase()}
                        </div>
                    )}
                    <span className="text-[13px] font-semibold text-zinc-800 dark:text-white/80 truncate max-w-[160px]">
                        {workspace.businessName ?? 'Propuesta'}
                    </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {validUntil && (
                        <span className={cn(
                            'hidden sm:inline text-[11px] font-medium px-2 py-0.5 rounded-md',
                            expired
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
                                : 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 dark:text-white/40',
                        )}>
                            {expired ? 'Expirada' : `Válida hasta ${formatDate(validUntil)}`}
                        </span>
                    )}
                    {s && (
                        <span className={cn('text-[11px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-lg', s.cls)}>
                            {s.label}
                        </span>
                    )}
                </div>
            </div>
        </header>
    );
}

// ─── Progress Stepper ─────────────────────────────────────────────────────────

type DealStage = 'brief' | 'waiting' | 'proposal' | 'approved';

function resolveStage(deal: PublicDealData): DealStage {
    const briefDone = deal.brief?.isCompleted ?? true;
    if (deal.brief && !briefDone) return 'brief';
    if ((deal.quotations?.length ?? 0) === 0) return 'waiting';
    if (deal.quotations?.some(q => q.isApproved)) return 'approved';
    return 'proposal';
}

const STAGES: { key: DealStage | 'progress'; label: string }[] = [
    { key: 'brief', label: 'Brief' },
    { key: 'proposal', label: 'Propuesta' },
    { key: 'approved', label: 'Aprobado' },
    { key: 'progress', label: 'En progreso' },
];

function ProgressStepper({ stage, brandColor }: { stage: DealStage; brandColor: string }) {
    const stageIdx = stage === 'brief' ? 0 : stage === 'waiting' ? 1 : stage === 'proposal' ? 1 : stage === 'approved' ? 2 : 3;

    return (
        <div className="flex items-center gap-0">
            {STAGES.map((s, idx) => {
                const done = idx < stageIdx;
                const active = idx === stageIdx;
                return (
                    <React.Fragment key={s.key}>
                        <div className="flex flex-col items-center gap-1.5">
                            <div className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors',
                                done ? 'text-white' : active ? 'text-white ring-4 ring-offset-1' : 'bg-zinc-100 dark:bg-white/[0.07] text-zinc-400 dark:text-white/30',
                            )}
                                style={done || active ? { backgroundColor: brandColor, ...(active ? { ringColor: brandColor + '33' } : {}) } : {}}
                            >
                                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                            </div>
                            <span className={cn(
                                'text-[10px] font-semibold whitespace-nowrap',
                                active ? 'text-zinc-800 dark:text-white' : done ? 'text-zinc-500 dark:text-white/50' : 'text-zinc-300 dark:text-white/20',
                            )}>
                                {s.label}
                            </span>
                        </div>
                        {idx < STAGES.length - 1 && (
                            <div className={cn(
                                'flex-1 h-px mx-2 mb-5 transition-colors',
                                idx < stageIdx ? 'bg-zinc-400 dark:bg-white/30' : 'bg-zinc-200 dark:bg-white/[0.08]',
                            )} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
    icon, title, state, children,
}: {
    icon: React.ReactNode;
    title: string;
    state: 'active' | 'done' | 'locked';
    children?: React.ReactNode;
}) {
    return (
        <div className={cn(
            'rounded-2xl border transition-colors overflow-hidden',
            state === 'locked'
                ? 'border-zinc-100 dark:border-white/[0.04] bg-zinc-50/50 dark:bg-white/[0.02]'
                : state === 'done'
                    ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/20 dark:bg-emerald-900/5'
                    : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a]',
        )}>
            <div className="flex items-center gap-3 px-5 py-4">
                <div className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                    state === 'locked' ? 'bg-zinc-100 dark:bg-white/[0.05] text-zinc-300 dark:text-white/20'
                        : state === 'done' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                            : 'bg-zinc-100 dark:bg-white/[0.08] text-zinc-600 dark:text-white/60',
                )}>
                    {state === 'done' ? <CheckCircle2 className="w-4 h-4" /> : state === 'locked' ? <Lock className="w-3.5 h-3.5" /> : icon}
                </div>
                <span className={cn(
                    'text-[13px] font-semibold',
                    state === 'locked' ? 'text-zinc-400 dark:text-white/25' : state === 'done' ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-900 dark:text-white',
                )}>
                    {title}
                </span>
                {state === 'done' && (
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md">
                        Completado
                    </span>
                )}
            </div>
            {children && <div className="border-t border-zinc-100 dark:border-white/[0.05]">{children}</div>}
        </div>
    );
}

// ─── Brief Form ───────────────────────────────────────────────────────────────

function BriefForm({
    deal,
    token,
    brandColor,
    onSubmitted,
}: {
    deal: PublicDealData;
    token: string;
    brandColor: string;
    onSubmitted: () => void;
}) {
    const { brief, client, workspace } = deal;
    const fields = brief?.template?.schema ?? [];

    const [responses, setResponses] = useState<BriefResponses>({});
    const [otherValues, setOtherValues] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    function isVisible(field: BriefField) {
        if (!field.dependsOn) return true;
        const { fieldId, value } = field.dependsOn;
        const response = responses[fieldId];
        if (Array.isArray(response)) return response.includes(value);
        return response === value;
    }

    function setResponse(fieldId: string, value: string | string[] | number) {
        setResponses(prev => ({ ...prev, [fieldId]: value }));
        setErrors(prev => { const n = { ...prev }; delete n[fieldId]; return n; });
    }

    function validate() {
        const errs: Record<string, string> = {};
        for (const field of fields) {
            if (!field.required || !isVisible(field)) continue;
            const val = responses[field.id];
            if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
                errs[field.id] = 'Este campo es obligatorio';
            }
        }
        return errs;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        const finalResponses: BriefResponses = { ...responses };
        for (const [fieldId, otherText] of Object.entries(otherValues)) {
            if (!otherText.trim()) continue;
            const current = finalResponses[fieldId];
            if (Array.isArray(current)) {
                finalResponses[fieldId] = current.map(v => v === '__other__' ? otherText : v);
            } else if (current === '__other__') {
                finalResponses[fieldId] = otherText;
            }
        }

        setSubmitting(true);
        try {
            await publicDealsApi.submitBrief(token, finalResponses);
            onSubmitted();
        } catch {
            setErrors({ _form: 'Hubo un error al enviar. Por favor intenta de nuevo.' });
        } finally {
            setSubmitting(false);
        }
    }

    const inputCls = 'w-full h-10 rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-white/[0.04] px-3.5 text-[13px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-white/20 transition';
    const textareaCls = 'w-full rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-white/[0.04] px-3.5 py-3 text-[13px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-white/20 transition resize-none';

    return (
        <div className="px-5 py-5">
            {brief?.template?.name && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] mb-5">
                    <ClipboardList className="w-3.5 h-3.5 text-zinc-500 dark:text-white/40" />
                    <span className="text-[12px] font-medium text-zinc-600 dark:text-white/55">
                        {brief.template.name}
                    </span>
                </div>
            )}

            <p className="text-[13px] text-zinc-500 dark:text-white/40 leading-relaxed mb-5">
                Antes de preparar tu propuesta, {workspace.businessName ?? 'el equipo'} necesita conocer un poco más
                sobre lo que buscas.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {fields.filter(isVisible).map((field, idx) => (
                    <div key={field.id} className="rounded-xl border border-zinc-200 dark:border-white/[0.07] bg-zinc-50/50 dark:bg-white/[0.03] px-5 py-4">
                        <div className="mb-3">
                            <label className="block text-[13px] font-semibold text-zinc-900 dark:text-white leading-snug">
                                <span className="text-zinc-400 dark:text-white/25 font-normal mr-2 text-[11px]">{idx + 1}.</span>
                                {field.label}
                                {field.required && <span className="text-red-400 ml-1">*</span>}
                            </label>
                            {field.description && (
                                <p className="text-[12px] text-zinc-400 dark:text-white/35 mt-1">{field.description}</p>
                            )}
                        </div>

                        {field.type === 'text' && (
                            <input className={inputCls} placeholder={field.tooltip ?? 'Tu respuesta...'} value={(responses[field.id] as string) ?? ''} onChange={e => setResponse(field.id, e.target.value)} />
                        )}
                        {field.type === 'textarea' && (
                            <textarea className={textareaCls} rows={4} placeholder={field.tooltip ?? 'Escribe aquí...'} value={(responses[field.id] as string) ?? ''} onChange={e => setResponse(field.id, e.target.value)} />
                        )}
                        {field.type === 'select' && (
                            <div className="relative">
                                <select className={inputCls + ' pr-9 appearance-none cursor-pointer'} value={(responses[field.id] as string) ?? ''} onChange={e => setResponse(field.id, e.target.value)}>
                                    <option value="">Selecciona una opción...</option>
                                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                            </div>
                        )}
                        {field.type === 'radio' && (
                            <div className="space-y-2">
                                {field.options?.map(opt => (
                                    <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
                                        <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors', responses[field.id] === opt ? 'border-zinc-900 dark:border-white' : 'border-zinc-300 dark:border-white/25')}>
                                            {responses[field.id] === opt && <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-white" />}
                                        </div>
                                        <input type="radio" className="sr-only" name={field.id} value={opt} checked={responses[field.id] === opt} onChange={() => setResponse(field.id, opt)} />
                                        <span className="text-[13px] text-zinc-700 dark:text-white/70">{opt}</span>
                                    </label>
                                ))}
                                {field.allowOther && (
                                    <label className="flex items-start gap-2.5 cursor-pointer">
                                        <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors', responses[field.id] === '__other__' ? 'border-zinc-900 dark:border-white' : 'border-zinc-300 dark:border-white/25')}>
                                            {responses[field.id] === '__other__' && <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-white" />}
                                        </div>
                                        <input type="radio" className="sr-only" name={field.id} value="__other__" checked={responses[field.id] === '__other__'} onChange={() => setResponse(field.id, '__other__')} />
                                        <div className="flex-1">
                                            <span className="text-[13px] text-zinc-700 dark:text-white/70">Otro</span>
                                            {responses[field.id] === '__other__' && (
                                                <input autoFocus className={inputCls + ' mt-2'} placeholder="Especifica..." value={otherValues[field.id] ?? ''} onChange={e => setOtherValues(p => ({ ...p, [field.id]: e.target.value }))} />
                                            )}
                                        </div>
                                    </label>
                                )}
                            </div>
                        )}
                        {field.type === 'checkbox' && (
                            <div className="space-y-2">
                                {field.options?.map(opt => {
                                    const current = (responses[field.id] as string[]) ?? [];
                                    const checked = current.includes(opt);
                                    return (
                                        <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
                                            <div className={cn('w-4 h-4 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-colors', checked ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white' : 'border-zinc-300 dark:border-white/25')}>
                                                {checked && <svg className="w-2.5 h-2.5 text-white dark:text-zinc-900" fill="none" viewBox="0 0 10 8"><path d="M1 4L4 7L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                            </div>
                                            <input type="checkbox" className="sr-only" checked={checked} onChange={() => {
                                                const next = checked ? current.filter(v => v !== opt) : [...current, opt];
                                                setResponse(field.id, next);
                                            }} />
                                            <span className="text-[13px] text-zinc-700 dark:text-white/70">{opt}</span>
                                        </label>
                                    );
                                })}
                                {field.allowOther && (
                                    <label className="flex items-start gap-2.5 cursor-pointer">
                                        <div className={cn('w-4 h-4 rounded-[4px] border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors', ((responses[field.id] as string[]) ?? []).includes('__other__') ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white' : 'border-zinc-300 dark:border-white/25')}>
                                            {((responses[field.id] as string[]) ?? []).includes('__other__') && <svg className="w-2.5 h-2.5 text-white dark:text-zinc-900" fill="none" viewBox="0 0 10 8"><path d="M1 4L4 7L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[13px] text-zinc-700 dark:text-white/70">Otro</span>
                                            {((responses[field.id] as string[]) ?? []).includes('__other__') && (
                                                <input autoFocus className={inputCls + ' mt-2'} placeholder="Especifica..." value={otherValues[field.id] ?? ''} onChange={e => setOtherValues(p => ({ ...p, [field.id]: e.target.value }))} />
                                            )}
                                        </div>
                                    </label>
                                )}
                            </div>
                        )}
                        {field.type === 'rating' && (
                            <div className="flex gap-2 flex-wrap">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button key={n} type="button" onClick={() => setResponse(field.id, n)}
                                        className={cn('w-10 h-10 rounded-xl border-2 text-[14px] font-bold transition-colors', responses[field.id] === n ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'border-zinc-200 dark:border-white/[0.1] text-zinc-500 dark:text-white/50 hover:border-zinc-400 dark:hover:border-white/30')}
                                    >{n}</button>
                                ))}
                            </div>
                        )}
                        {errors[field.id] && <p className="text-[11px] text-red-500 mt-1.5">{errors[field.id]}</p>}
                    </div>
                ))}

                {errors._form && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 px-4 py-3">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <p className="text-[12px] text-red-600 dark:text-red-400">{errors._form}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    style={{ backgroundColor: brandColor }}
                    className="w-full h-12 rounded-2xl text-white text-[14px] font-bold hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2.5"
                >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {submitting ? 'Enviando...' : 'Enviar respuestas'}
                </button>
            </form>
        </div>
    );
}

// ─── Quotation Card ───────────────────────────────────────────────────────────

function QuotationCard({
    quotation, symbol, isSelected, onSelect, hasMultiple, brandColor,
}: {
    quotation: PublicDealQuotation;
    symbol: string;
    isSelected: boolean;
    onSelect: () => void;
    hasMultiple: boolean;
    brandColor: string;
}) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className={cn('rounded-xl border-2 transition-colors overflow-hidden', isSelected && hasMultiple ? 'border-zinc-900 dark:border-white' : 'border-zinc-200 dark:border-white/[0.08]')}>
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => { if (hasMultiple) onSelect(); else setExpanded(e => !e); }}>
                <div className="flex items-center gap-3">
                    {hasMultiple && (
                        <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0', isSelected ? 'border-zinc-900 dark:border-white' : 'border-zinc-300 dark:border-white/25')}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-white" />}
                        </div>
                    )}
                    <div>
                        <p className="text-[14px] font-bold text-zinc-900 dark:text-white">{quotation.optionName}</p>
                        {quotation.description && <p className="text-[12px] text-zinc-500 dark:text-white/40 mt-0.5">{quotation.description}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <p className="text-[18px] font-black text-zinc-900 dark:text-white tabular-nums">{fmt(quotation.total, symbol)}</p>
                    {!hasMultiple && (expanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />)}
                </div>
            </div>

            {(expanded || isSelected) && quotation.items?.length > 0 && (
                <div className="border-t border-zinc-100 dark:border-white/[0.05] divide-y divide-zinc-100 dark:divide-white/[0.04]">
                    {quotation.items.map(item => (
                        <div key={item.id} className="flex items-start justify-between gap-4 px-5 py-3.5">
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-zinc-800 dark:text-white">{item.name}</p>
                                {item.description && <p className="text-[12px] text-zinc-400 dark:text-white/35 mt-0.5 leading-snug">{item.description}</p>}
                                {item.quantity > 1 && <p className="text-[11px] text-zinc-400 dark:text-white/30 mt-0.5">{item.quantity} × {fmt(item.price, symbol)}</p>}
                            </div>
                            <p className="text-[13px] font-semibold text-zinc-800 dark:text-white tabular-nums shrink-0">{fmt(item.subtotal, symbol)}</p>
                        </div>
                    ))}
                    {(quotation.discount > 0 || quotation.taxTotal > 0) && (
                        <div className="px-5 py-3 space-y-1.5">
                            {quotation.discount > 0 && (
                                <div className="flex justify-between text-[12px]">
                                    <span className="text-zinc-500 dark:text-white/40">Descuento</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">−{fmt(quotation.discount, symbol)}</span>
                                </div>
                            )}
                            {quotation.taxTotal > 0 && (
                                <div className="flex justify-between text-[12px]">
                                    <span className="text-zinc-500 dark:text-white/40">Impuestos</span>
                                    <span className="text-zinc-700 dark:text-white/60">{fmt(quotation.taxTotal, symbol)}</span>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex justify-between items-center px-5 py-3.5 bg-zinc-50/80 dark:bg-white/[0.03]">
                        <span className="text-[12px] font-semibold text-zinc-500 dark:text-white/40 uppercase tracking-wider">Total</span>
                        <span className="text-[18px] font-black text-zinc-900 dark:text-white tabular-nums">{fmt(quotation.total, symbol)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Proposal Section ─────────────────────────────────────────────────────────

function ProposalSection({
    deal, token, brandColor, onApproved,
}: {
    deal: PublicDealData;
    token: string;
    brandColor: string;
    onApproved: () => void;
}) {
    const quotations = deal.quotations ?? [];
    const alreadyApproved = quotations.some(q => q.isApproved);
    const [selectedId, setSelectedId] = useState(quotations.find(q => q.isApproved)?.id ?? quotations[0]?.id);
    const [localApproved, setLocalApproved] = useState(alreadyApproved);
    const [localQuotations, setLocalQuotations] = useState(quotations);
    const [confirming, setConfirming] = useState(false);
    const [approving, setApproving] = useState(false);
    const hasMultiple = localQuotations.length > 1;
    const selected = localQuotations.find(q => q.id === selectedId) ?? localQuotations[0];
    const isLocalApproved = localApproved || localQuotations.some(q => q.isApproved);
    const expired = isExpired(deal.validUntil);

    const handleApprove = async () => {
        if (!selectedId) return;
        setApproving(true);
        try {
            await publicDealsApi.approveQuotation(token, selectedId);
            setLocalQuotations(prev => prev.map(q => ({ ...q, isApproved: q.id === selectedId })));
            setLocalApproved(true);
            setConfirming(false);
            onApproved();
        } catch {
            // no-op
        } finally {
            setApproving(false);
        }
    };

    if (quotations.length === 0) {
        return (
            <div className="px-5 py-8 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/[0.06] flex items-center justify-center">
                    <Clock className="w-5 h-5 text-zinc-400 dark:text-white/30" />
                </div>
                <div>
                    <p className="text-[14px] font-semibold text-zinc-700 dark:text-white/70 mb-1">Preparando tu propuesta</p>
                    <p className="text-[12px] text-zinc-400 dark:text-white/35 leading-relaxed max-w-[260px]">
                        {deal.workspace.businessName ?? 'El equipo'} está trabajando en ella. Te notificaremos cuando esté lista.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-5 py-5 space-y-4">
            {deal.proposalIntro && (
                <p className="text-[13px] text-zinc-600 dark:text-white/55 leading-relaxed whitespace-pre-line">{deal.proposalIntro}</p>
            )}

            {/* Tab selector */}
            {hasMultiple && !isLocalApproved && (
                <div className="flex gap-2 flex-wrap">
                    {localQuotations.map(q => (
                        <button
                            key={q.id}
                            onClick={() => setSelectedId(q.id)}
                            className={cn(
                                'px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors border',
                                selectedId === q.id
                                    ? 'text-white border-transparent'
                                    : 'bg-white dark:bg-white/[0.04] text-zinc-600 dark:text-white/55 border-zinc-200 dark:border-white/[0.08] hover:border-zinc-400',
                            )}
                            style={selectedId === q.id ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                        >
                            {q.optionName}
                        </button>
                    ))}
                </div>
            )}

            <div className="space-y-3">
                {isLocalApproved
                    ? localQuotations.filter(q => q.isApproved).map(q => (
                        <QuotationCard key={q.id} quotation={q} symbol={getCurrencySymbol(deal, q)} isSelected={false} onSelect={() => {}} hasMultiple={false} brandColor={brandColor} />
                    ))
                    : selected && (
                        <QuotationCard quotation={selected} symbol={getCurrencySymbol(deal, selected)} isSelected={true} onSelect={() => {}} hasMultiple={false} brandColor={brandColor} />
                    )
                }
            </div>

            {/* Approved banner */}
            {isLocalApproved && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/15 px-4 py-3.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-[13px] font-semibold text-emerald-800 dark:text-emerald-300">Propuesta aprobada</p>
                        <p className="text-[12px] text-emerald-700/70 dark:text-emerald-400/60 mt-0.5 leading-snug">
                            {deal.workspace.businessName ?? 'El equipo'} ya fue notificado y puede comenzar con el proyecto.
                        </p>
                    </div>
                </div>
            )}

            {/* Approve CTA */}
            {!isLocalApproved && !expired && (
                <div>
                    {!confirming ? (
                        <button
                            onClick={() => setConfirming(true)}
                            style={{ backgroundColor: brandColor }}
                            className="w-full h-12 rounded-2xl text-white text-[14px] font-bold hover:opacity-90 active:opacity-80 transition-opacity flex items-center justify-center gap-2.5 shadow-sm"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {hasMultiple ? `Aprobar "${selected?.optionName}"` : 'Aprobar esta propuesta'}
                        </button>
                    ) : (
                        <div className="rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.03] p-4">
                            <p className="text-[13px] font-semibold text-zinc-900 dark:text-white mb-1">¿Confirmar aprobación?</p>
                            <p className="text-[12px] text-zinc-500 dark:text-white/40 mb-4 leading-snug">
                                Al aprobar, {deal.workspace.businessName ?? 'el equipo'} recibirá una notificación y podrá proceder.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleApprove}
                                    disabled={approving}
                                    style={{ backgroundColor: brandColor }}
                                    className="flex-1 h-10 rounded-xl text-white text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    {approving ? 'Aprobando...' : 'Sí, aprobar'}
                                </button>
                                <button
                                    onClick={() => setConfirming(false)}
                                    disabled={approving}
                                    className="px-4 h-10 rounded-xl border border-zinc-200 dark:border-white/[0.1] text-[13px] font-medium text-zinc-600 dark:text-white/60 hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {expired && !isLocalApproved && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/40 px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-[12px] text-red-600 dark:text-red-400">Esta propuesta ha expirado. Contacta a {deal.workspace.businessName ?? 'tu proveedor'}.</p>
                </div>
            )}
        </div>
    );
}

// ─── Payment Section ──────────────────────────────────────────────────────────

function PaymentSection({ deal }: { deal: PublicDealData }) {
    const paymentPlan = deal.paymentPlan;
    const approvedQ = deal.quotations?.find(q => q.isApproved);
    const sym = getCurrencySymbol(deal, approvedQ);

    const milestoneStyle: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
        PENDING:   { icon: <Clock className="w-3 h-3" />,         cls: 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 dark:text-white/40',         label: 'Pendiente' },
        PAID:      { icon: <CheckCircle2 className="w-3 h-3" />, cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', label: 'Pagado' },
        OVERDUE:   { icon: <AlertCircle className="w-3 h-3" />,  cls: 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400',                label: 'Vencido' },
        CANCELLED: { icon: <AlertCircle className="w-3 h-3" />,  cls: 'bg-zinc-50 dark:bg-white/[0.03] text-zinc-400 dark:text-white/30',           label: 'Cancelado' },
    };

    if (!paymentPlan?.milestones?.length) return null;

    return (
        <div className="px-5 py-5 space-y-3">
            {paymentPlan.milestones.map((m, i) => {
                const style = milestoneStyle[m.status] ?? milestoneStyle['PENDING'];
                return (
                    <div key={m.id} className="flex items-start gap-3 rounded-xl border border-zinc-100 dark:border-white/[0.05] bg-zinc-50/50 dark:bg-white/[0.02] px-4 py-3.5">
                        <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-white/[0.1] flex items-center justify-center shrink-0 text-[10px] font-bold text-zinc-500 dark:text-white/40 mt-0.5">
                            {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div>
                                    <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">{m.name}</p>
                                    {m.description && <p className="text-[11px] text-zinc-400 dark:text-white/35 mt-0.5">{m.description}</p>}
                                    {m.dueDate && (
                                        <p className="text-[11px] text-zinc-400 dark:text-white/35 mt-1 flex items-center gap-1">
                                            <CalendarDays className="w-3 h-3" />{formatDate(m.dueDate)}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[14px] font-bold text-zinc-900 dark:text-white tabular-nums">{fmt(m.amount, sym)}</p>
                                    {m.percentage != null && <p className="text-[10px] text-zinc-400 dark:text-white/35">{m.percentage}%</p>}
                                </div>
                            </div>
                            <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md mt-2', style.cls)}>
                                {style.icon}{style.label}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Deal Overview (unified view) ─────────────────────────────────────────────

function DealOverview({ deal, token, brandColor }: { deal: PublicDealData; token: string; brandColor: string }) {
    const [currentDeal, setCurrentDeal] = useState(deal);
    const stage = resolveStage(currentDeal);

    const hasBrief = !!currentDeal.brief;
    const briefDone = currentDeal.brief?.isCompleted ?? true;
    const isApproved = currentDeal.quotations?.some(q => q.isApproved) ?? false;
    const hasPaymentPlan = (currentDeal.paymentPlan?.milestones?.length ?? 0) > 0;
    const hasQuotations = (currentDeal.quotations?.length ?? 0) > 0;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            {/* Client greeting */}
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-white/30">
                    Propuesta para
                </p>
                <h1 className="text-[26px] sm:text-[30px] font-black text-zinc-900 dark:text-white tracking-tight leading-tight mt-1">
                    {currentDeal.client.name}
                </h1>
            </div>

            {/* Progress stepper */}
            <ProgressStepper stage={stage} brandColor={brandColor} />

            {/* ── Section 1: Brief ── */}
            {hasBrief && (
                <Section
                    icon={<ClipboardList className="w-4 h-4" />}
                    title={currentDeal.brief!.template?.name ?? 'Cuestionario'}
                    state={briefDone ? 'done' : 'active'}
                >
                    {!briefDone && (
                        <BriefForm
                            deal={currentDeal}
                            token={token}
                            brandColor={brandColor}
                            onSubmitted={() => {
                                setCurrentDeal(prev => ({
                                    ...prev,
                                    brief: prev.brief ? { ...prev.brief, isCompleted: true } : prev.brief,
                                }));
                            }}
                        />
                    )}
                </Section>
            )}

            {/* ── Section 2: Propuesta ── */}
            <Section
                icon={<FileText className="w-4 h-4" />}
                title={isApproved ? 'Propuesta aprobada' : 'Propuesta'}
                state={isApproved ? 'done' : hasQuotations ? 'active' : hasBrief && !briefDone ? 'locked' : 'active'}
            >
                <ProposalSection
                    deal={currentDeal}
                    token={token}
                    brandColor={brandColor}
                    onApproved={() => {
                        setCurrentDeal(prev => ({
                            ...prev,
                            quotations: prev.quotations?.map(q => ({ ...q, isApproved: q.id === prev.quotations?.find(q2 => q2.id === (prev.quotations?.find(q3 => q3.isApproved)?.id ?? prev.quotations?.[0]?.id))?.id })),
                        }));
                    }}
                />
            </Section>

            {/* ── Section 3: Plan de pagos ── */}
            <Section
                icon={<CreditCard className="w-4 h-4" />}
                title="Plan de pagos"
                state={isApproved ? 'active' : 'locked'}
            >
                {isApproved && hasPaymentPlan && <PaymentSection deal={currentDeal} />}
                {isApproved && !hasPaymentPlan && (
                    <div className="px-5 py-6 text-center">
                        <p className="text-[13px] text-zinc-400 dark:text-white/30">Sin plan de pagos configurado.</p>
                    </div>
                )}
            </Section>

            {/* Terms */}
            {currentDeal.proposalTerms && (
                <div className="rounded-2xl border border-zinc-100 dark:border-white/[0.05] bg-white dark:bg-[#1a1a1a] px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-white/25 mb-2">Términos y Condiciones</p>
                    <p className="text-[12px] text-zinc-500 dark:text-white/40 leading-relaxed whitespace-pre-line">{currentDeal.proposalTerms}</p>
                </div>
            )}

            {/* Portal CTA */}
            <div className="rounded-2xl border border-zinc-200 dark:border-white/[0.07] bg-white dark:bg-[#1a1a1a] overflow-hidden">
                <div className="px-6 py-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-zinc-500 dark:text-white/40" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-[14px] font-bold text-zinc-900 dark:text-white mb-1">
                            Accede a tu portal de cliente
                        </h3>
                        <p className="text-[12px] text-zinc-500 dark:text-white/40 leading-relaxed mb-4">
                            Crea una cuenta para consultar el historial de tus proyectos, ver el estado de pagos y
                            descargar documentos.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={`/register?email=${encodeURIComponent(currentDeal.client.email ?? '')}&role=client`}
                                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[12px] font-semibold hover:opacity-90 transition-opacity"
                            >
                                Crear cuenta gratis <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex items-center h-9 px-4 rounded-xl border border-zinc-200 dark:border-white/[0.1] text-[12px] font-medium text-zinc-600 dark:text-white/60 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors"
                            >
                                Ya tengo cuenta
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Root Page ─────────────────────────────────────────────────────────────────

export default function PublicDealPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);

    const [deal, setDeal] = useState<PublicDealData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [requiresPassword, setRequiresPassword] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [isCheckingPassword, setIsCheckingPassword] = useState(false);

    const loadDeal = useCallback((password?: string) => {
        setIsLoading(true);
        publicDealsApi.getDeal(token, password)
            .then(data => { setDeal(data); setRequiresPassword(false); })
            .catch((err: unknown) => {
                type ErrShape = { response?: { status?: number; data?: { message?: { requiresPassword?: boolean } } } };
                const e = err as ErrShape;
                if (e?.response?.status === 401 && e?.response?.data?.message?.requiresPassword) {
                    setRequiresPassword(true);
                    if (password) setPasswordError(true);
                } else {
                    setNotFound(true);
                }
            })
            .finally(() => setIsLoading(false));
    }, [token]);

    useEffect(() => { loadDeal(); }, [loadDeal]);

    const submitPassword = () => {
        if (!passwordInput) return;
        setPasswordError(false);
        setIsCheckingPassword(true);
        publicDealsApi.getDeal(token, passwordInput)
            .then(data => { setDeal(data); setRequiresPassword(false); })
            .catch((err: unknown) => {
                type ErrShape = { response?: { status?: number; data?: { message?: { requiresPassword?: boolean } } } };
                const e = err as ErrShape;
                if (e?.response?.status === 401 && e?.response?.data?.message?.requiresPassword) {
                    setPasswordError(true);
                } else {
                    setNotFound(true);
                }
            })
            .finally(() => setIsCheckingPassword(false));
    };

    if (isLoading) return <PageSkeleton />;

    if (requiresPassword) {
        return (
            <div className="min-h-screen bg-[#fafafa] dark:bg-[#0d0d0d] flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm text-center">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-5">
                            <Lock className="w-7 h-7 text-zinc-400 dark:text-white/30" />
                        </div>
                        <h1 className="text-[20px] font-bold text-zinc-900 dark:text-white mb-1">Propuesta protegida</h1>
                        <p className="text-[13px] text-zinc-500 dark:text-white/40 mb-6">
                            Ingresa la contraseña para acceder
                        </p>
                        <div className="space-y-3">
                            <input
                                type="password"
                                autoFocus
                                value={passwordInput}
                                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                                onKeyDown={(e) => { if (e.key === 'Enter') submitPassword(); }}
                                placeholder="Contraseña"
                                className={cn(
                                    'w-full border rounded-xl px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition',
                                    passwordError
                                        ? 'border-red-400 focus:ring-red-400/20'
                                        : 'border-zinc-200 dark:border-zinc-700 focus:ring-primary/20',
                                )}
                            />
                            {passwordError && (
                                <p className="text-[12px] text-red-500 text-left">Contraseña incorrecta</p>
                            )}
                            <button
                                onClick={submitPassword}
                                disabled={!passwordInput || isCheckingPassword}
                                className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition"
                            >
                                {isCheckingPassword ? 'Verificando...' : 'Acceder'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (notFound || !deal) {
        return (
            <div className="min-h-screen bg-[#fafafa] dark:bg-[#0d0d0d] flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-5">
                        <FileText className="w-7 h-7 text-zinc-400 dark:text-white/30" />
                    </div>
                    <h1 className="text-[20px] font-bold text-zinc-900 dark:text-white mb-2">Propuesta no encontrada</h1>
                    <p className="text-[13px] text-zinc-500 dark:text-white/40 leading-relaxed">
                        El enlace puede haber expirado o ser incorrecto.
                    </p>
                </div>
            </div>
        );
    }

    const brandColor = deal.workspace.brandColor || '#18181b';

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#0c0c0c] font-sans">
            <PageHeader
                workspace={deal.workspace}
                status={deal.status}
                validUntil={deal.validUntil}
                brandColor={brandColor}
            />
            <DealOverview deal={deal} token={token} brandColor={brandColor} />
            <footer className="border-t border-zinc-200 dark:border-white/[0.06] mt-4">
                <div className="max-w-3xl mx-auto px-5 py-5 flex items-center justify-between gap-4 flex-wrap">
                    <p className="text-[11px] text-zinc-400 dark:text-white/25">
                        Propuesta generada con{' '}
                        <span className="font-semibold text-zinc-500 dark:text-white/35">Hi Krew</span>
                    </p>
                    {deal.client.email && (
                        <p className="text-[11px] text-zinc-400 dark:text-white/25">Enviado a {deal.client.email}</p>
                    )}
                </div>
            </footer>
        </div>
    );
}
