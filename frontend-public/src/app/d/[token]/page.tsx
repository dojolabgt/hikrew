'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    Loader2, CheckCircle2, Clock, AlertCircle, Lock,
    ArrowRight, Star, ChevronDown, CreditCard, Calendar,
    ClipboardList, FileText, Sparkles, KeyRound, LayoutDashboard,
    ChevronRight, Upload, FolderOpen, Briefcase,
} from 'lucide-react';
import { getImageUrl } from '@/lib/image-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Types ──────────────────────────────────────────────────────────────────────

type BriefFieldType = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'rating';
type BriefOption = string | { label: string; value: string };
type BriefResponses = Record<string, string | string[] | number>;

interface BriefField {
    id: string; type: BriefFieldType; label: string;
    description?: string; required: boolean;
    options?: BriefOption[]; allowOther?: boolean;
    dependsOn?: { fieldId: string; value: string };
}

interface QuotationItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  discount?: number;
  /** Computed by the backend (price × quantity − discount). Always use this
   *  value; never recalculate on the client to keep both frontends in sync. */
  subtotal: number;
}
interface Quotation { id: string; optionName: string; description?: string; currency?: string; isApproved: boolean; subtotal: number; discount: number; taxTotal: number; total: number; items: QuotationItem[]; }
interface Milestone { id: string; name: string; amount: number; percentage?: number; dueDate?: string; status: string; }

interface DealData {
    id: string; proposalIntro?: string; proposalTerms?: string; validUntil?: string; status?: string;
    client: { id?: string; name: string; email?: string };
    workspace: { businessName?: string; logo?: string; brandColor?: string };
    currency?: { symbol?: string; code?: string };
    brief?: { isCompleted: boolean; publicToken?: string; template: { name: string; schema: BriefField[] } };
    quotations?: Quotation[];
    paymentPlan?: { id: string; milestones: Milestone[] };
    project?: { id: string; name: string; status: string; clientUploadsEnabled: boolean };
}

type NavKey = 'overview' | 'brief' | 'proposal' | 'payment' | 'project';

// ─── Helpers ─────────────────────────────────────────────────────────────────────

const CURRENCY_FALLBACKS: Record<string, string> = {
    GTQ: 'Q', USD: '$', EUR: '€', MXN: '$', GBP: '£', JPY: '¥',
    CAD: '$', AUD: '$', BRL: 'R$', COP: '$', ARS: '$',
    PEN: 'S/', CLP: '$', CRC: '₡', HNL: 'L', NIO: 'C$', DOP: 'RD$',
};
function getSymbol(deal: DealData, q?: Quotation) {
    if (q?.currency) return CURRENCY_FALLBACKS[q.currency] ?? q.currency;
    return deal.currency?.symbol ?? '$';
}
function fmt(n: number, sym: string) { return `${sym}${Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`; }
function fmtDate(iso?: string) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }); }
function optLabel(opt: BriefOption): string { return typeof opt === 'string' ? opt : opt.label; }
function optValue(opt: BriefOption): string { return typeof opt === 'string' ? opt : opt.value; }
function cn(...cls: (string | false | undefined | null)[]) { return cls.filter(Boolean).join(' '); }

// ─── Stage logic ─────────────────────────────────────────────────────────────────

type Stage = 'brief' | 'proposal' | 'approved' | 'progress';
function resolveStage(deal: DealData): Stage {
    if (deal.project) return 'progress';
    if (deal.brief && !deal.brief.isCompleted) return 'brief';
    if (deal.quotations?.some(q => q.isApproved)) return 'approved';
    return 'proposal';
}

const STAGE_STEPS: { key: Stage; label: string }[] = [
    { key: 'brief', label: 'Brief' },
    { key: 'proposal', label: 'Propuesta' },
    { key: 'approved', label: 'Aprobado' },
    { key: 'progress', label: 'En progreso' },
];

// ─── Brief Form ───────────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-xl border border-white/[0.15] bg-white/[0.06] px-4 py-3 text-base text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-all disabled:opacity-40";

function BriefForm({ deal, onSubmitted }: { deal: DealData; onSubmitted: () => void }) {
    const schema = deal.brief!.template.schema;
    const [responses, setResponses] = useState<BriefResponses>({});
    const [otherValues, setOtherValues] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const isVisible = (f: BriefField) => !f.dependsOn || (Array.isArray(responses[f.dependsOn.fieldId]) ? (responses[f.dependsOn.fieldId] as string[]).includes(f.dependsOn.value) : responses[f.dependsOn.fieldId] === f.dependsOn.value);
    const setResp = (id: string, val: string | string[] | number) => { setResponses(r => ({ ...r, [id]: val })); setErrors(e => { const n = { ...e }; delete n[id]; return n; }); };
    const toggleCb = (id: string, opt: string) => { const cur = (responses[id] as string[]) || []; setResp(id, cur.includes(opt) ? cur.filter(v => v !== opt) : [...cur, opt]); };
    const validate = () => {
        const errs: Record<string, string> = {};
        schema.filter(isVisible).forEach(f => {
            if (!f.required) return;
            const v = responses[f.id];
            if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) errs[f.id] = 'Requerido';
        });
        setErrors(errs);
        return !Object.keys(errs).length;
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true); setSubmitError(null);
        try {
            const res = await fetch(`${API_URL}/public/briefs/${deal.brief!.publicToken}/submit`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(responses),
            });
            if (!res.ok) throw new Error();
            onSubmitted();
        } catch { setSubmitError('No se pudo enviar. Inténtalo de nuevo.'); }
        finally { setSubmitting(false); }
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            {schema.filter(isVisible).map(field => (
                <div key={field.id} className="space-y-2">
                    <label className="block text-base font-semibold text-white/90">
                        {field.label}{field.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    {field.description && <p className="text-sm text-white/55">{field.description}</p>}

                    {field.type === 'text' && <input className={inputCls} value={(responses[field.id] as string) || ''} onChange={e => setResp(field.id, e.target.value)} placeholder="Tu respuesta..." />}
                    {field.type === 'textarea' && <textarea className={inputCls + ' h-24 resize-none'} value={(responses[field.id] as string) || ''} onChange={e => setResp(field.id, e.target.value)} placeholder="Tu respuesta..." />}
                    {field.type === 'select' && (
                        <div className="relative">
                            <select className={inputCls + ' appearance-none pr-10 cursor-pointer'} value={(responses[field.id] as string) || ''} onChange={e => setResp(field.id, e.target.value)}>
                                <option value="" className="bg-zinc-900">Selecciona una opción</option>
                                {field.options?.map(o => <option key={optValue(o)} value={optValue(o)} className="bg-zinc-900">{optLabel(o)}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                        </div>
                    )}
                    {field.type === 'radio' && (
                        <div className="space-y-3">
                            {field.options?.map(o => (
                                <label key={optValue(o)} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0', responses[field.id] === optValue(o) ? 'border-white bg-white' : 'border-white/25 group-hover:border-white/50')}>
                                        {responses[field.id] === optValue(o) && <div className="w-2 h-2 rounded-full bg-zinc-900" />}
                                    </div>
                                    <input type="radio" className="sr-only" checked={responses[field.id] === optValue(o)} onChange={() => setResp(field.id, optValue(o))} />
                                    <span className="text-base text-white/80">{optLabel(o)}</span>
                                </label>
                            ))}
                            {field.allowOther && (
                                <>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0', responses[field.id] === '__other__' ? 'border-white bg-white' : 'border-white/25 group-hover:border-white/50')}>
                                            {responses[field.id] === '__other__' && <div className="w-2 h-2 rounded-full bg-zinc-900" />}
                                        </div>
                                        <input type="radio" className="sr-only" checked={responses[field.id] === '__other__'} onChange={() => setResp(field.id, '__other__')} />
                                        <span className="text-base text-white/55 italic">Otro</span>
                                    </label>
                                    {responses[field.id] === '__other__' && <input className={inputCls} value={otherValues[field.id] || ''} onChange={e => { setOtherValues(v => ({ ...v, [field.id]: e.target.value })); setResp(field.id, e.target.value || '__other__'); }} placeholder="Especifica..." />}
                                </>
                            )}
                        </div>
                    )}
                    {field.type === 'checkbox' && (
                        <div className="space-y-3">
                            {field.options?.map(o => {
                                const v = optValue(o); const checked = ((responses[field.id] as string[]) || []).includes(v);
                                return (
                                    <label key={v} className="flex items-center gap-3 cursor-pointer group">
                                        <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0', checked ? 'border-white bg-white' : 'border-white/25 group-hover:border-white/50')}>
                                            {checked && <svg className="w-3 h-3 text-zinc-900" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                        </div>
                                        <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleCb(field.id, v)} />
                                        <span className="text-base text-white/80">{optLabel(o)}</span>
                                    </label>
                                );
                            })}
                            {field.allowOther && (() => {
                                const otherChecked = ((responses[field.id] as string[]) || []).includes('__other__');
                                return (
                                    <>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0', otherChecked ? 'border-white bg-white' : 'border-white/25 group-hover:border-white/50')}>
                                                {otherChecked && <svg className="w-3 h-3 text-zinc-900" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                            </div>
                                            <input type="checkbox" className="sr-only" checked={otherChecked} onChange={() => toggleCb(field.id, '__other__')} />
                                            <span className="text-base text-white/55 italic">Otro</span>
                                        </label>
                                        {otherChecked && <input className={inputCls} value={otherValues[field.id] || ''} onChange={e => { setOtherValues(v => ({ ...v, [field.id]: e.target.value })); }} placeholder="Especifica..." />}
                                    </>
                                );
                            })()}
                        </div>
                    )}
                    {field.type === 'rating' && (
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(n => (
                                <button key={n} type="button" onClick={() => setResp(field.id, n)}>
                                    <Star className={cn('w-7 h-7 transition-colors', Number(responses[field.id]) >= n ? 'text-amber-400 fill-amber-400' : 'text-white/20')} />
                                </button>
                            ))}
                        </div>
                    )}
                    {errors[field.id] && <p className="text-sm text-red-400 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors[field.id]}</p>}
                </div>
            ))}
            {submitError && <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"><AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" /><p className="text-[13px] text-red-400">{submitError}</p></div>}
            <button type="submit" disabled={submitting} className="w-full h-13 rounded-full bg-white hover:bg-white/90 text-zinc-900 font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                {submitting ? <><Loader2 className="w-5 h-5 animate-spin" />Enviando...</> : <>Enviar cuestionario <ArrowRight className="w-4 h-4" /></>}
            </button>
        </form>
    );
}

// ─── Views ────────────────────────────────────────────────────────────────────────

function OverviewView({ deal, brandColor, onNav }: { deal: DealData; brandColor: string; onNav: (k: NavKey) => void }) {
    const stage = resolveStage(deal);
    const stageIdx = STAGE_STEPS.findIndex(s => s.key === stage);
    const approvedQ = deal.quotations?.find(q => q.isApproved);
    const sym = getSymbol(deal, approvedQ);

    return (
        <div className="space-y-4">
            {/* Progress stepper */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Progreso</p>
                <div className="flex items-center">
                    {STAGE_STEPS.map((s, i) => {
                        const done = i < stageIdx; const active = i === stageIdx;
                        return (
                            <React.Fragment key={s.key}>
                                <div className="flex flex-col items-center gap-1.5 shrink-0">
                                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold', !done && !active && 'bg-white/[0.07] text-white/35')}
                                        style={done || active ? { backgroundColor: done ? brandColor + 'bb' : brandColor, color: '#fff' } : {}}>
                                        {done ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                                    </div>
                                    <span className={cn('text-xs font-bold whitespace-nowrap', active ? 'text-white' : done ? 'text-white/60' : 'text-white/35')}>{s.label}</span>
                                </div>
                                {i < STAGE_STEPS.length - 1 && <div className={cn('flex-1 h-px mx-2 mb-5', i < stageIdx ? 'bg-white/30' : 'bg-white/[0.07]')} />}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Brief card */}
                {deal.brief && (
                    <button onClick={() => onNav('brief')} className="text-left rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.08] transition-colors p-5 group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center">
                                <ClipboardList className="w-5 h-5 text-white/60" />
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/35 group-hover:text-white/60 transition-colors mt-1" />
                        </div>
                        <p className="text-sm font-bold text-white/90 mb-1">{deal.brief.template.name}</p>
                        <p className="text-sm text-white/55">{deal.brief.isCompleted ? 'Completado' : 'Pendiente de completar'}</p>
                        {deal.brief.isCompleted
                            ? <span className="mt-3 inline-block text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">Listo</span>
                            : <span className="mt-3 inline-block text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md">Pendiente</span>
                        }
                    </button>
                )}

                {/* Proposal card */}
                <button onClick={() => onNav('proposal')} className="text-left rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.08] transition-colors p-5 group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white/60" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/35 group-hover:text-white/60 transition-colors mt-1" />
                    </div>
                    <p className="text-sm font-bold text-white/90 mb-1">Propuesta</p>
                    {approvedQ
                        ? <><p className="text-sm text-white/55">{approvedQ.optionName}</p><p className="text-xl font-black text-white mt-1.5">{fmt(approvedQ.total, sym)}</p><span className="mt-2 inline-block text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">Aprobada</span></>
                        : (deal.quotations?.length ?? 0) > 0
                            ? <><p className="text-sm text-white/55">{deal.quotations!.length} opción(es) disponibles</p><span className="mt-3 inline-block text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md">Por aprobar</span></>
                            : <><p className="text-sm text-white/55">En preparación</p><span className="mt-3 inline-block text-xs font-bold uppercase tracking-wider text-white/40 bg-white/[0.07] px-2.5 py-1 rounded-md">Pendiente</span></>
                    }
                </button>

                {/* Payment card */}
                <button onClick={() => onNav('payment')} className="text-left rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.08] transition-colors p-5 group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-white/60" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/35 group-hover:text-white/60 transition-colors mt-1" />
                    </div>
                    <p className="text-sm font-bold text-white/90 mb-1">Plan de pagos</p>
                    {(deal.paymentPlan?.milestones?.length ?? 0) > 0
                        ? <p className="text-sm text-white/55">{deal.paymentPlan!.milestones.length} hito(s)</p>
                        : <p className="text-sm text-white/55">Sin configurar aún</p>
                    }
                </button>

                {/* Project card */}
                {deal.project && (
                    <button onClick={() => onNav('project')} className="text-left rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] hover:bg-blue-500/[0.09] transition-colors p-5 group sm:col-span-2">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                                <Briefcase className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                <ChevronRight className="w-5 h-5 text-blue-400/50 group-hover:text-blue-400/80 transition-colors" />
                            </div>
                        </div>
                        <p className="text-sm font-bold text-white/90 mb-1">{deal.project.name}</p>
                        <p className="text-sm text-blue-400/75">
                            {deal.project.clientUploadsEnabled ? 'Puedes subir archivos al proyecto' : 'Proyecto en progreso'}
                        </p>
                        <span className="mt-3 inline-block text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md">En progreso</span>
                    </button>
                )}
            </div>

            {deal.proposalTerms && (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />Términos y Condiciones</p>
                    <p className="text-sm text-white/55 leading-relaxed whitespace-pre-line">{deal.proposalTerms}</p>
                </div>
            )}
        </div>
    );
}

function ProposalView({ deal, token, onApproved }: { deal: DealData; token: string; onApproved: (id: string) => void }) {
    const quotations = deal.quotations ?? [];
    const [activeId, setActiveId] = useState(quotations[0]?.id ?? null);
    const [confirming, setConfirming] = useState(false);
    const [approving, setApproving] = useState(false);
    const isApproved = quotations.some(q => q.isApproved);
    const approvedQ = quotations.find(q => q.isApproved);
    const activeQ = quotations.find(q => q.id === activeId) ?? quotations[0];
    const displayQ = isApproved ? approvedQ! : activeQ;
    const sym = getSymbol(deal, displayQ);

    const handleApprove = async () => {
        if (!activeQ || approving) return;
        setApproving(true);
        try {
            const res = await fetch(`${API_URL}/public/deals/${token}/approve-quotation/${activeQ.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
            if (!res.ok) throw new Error();
            onApproved(activeQ.id); setConfirming(false);
        } catch { /* silent */ } finally { setApproving(false); }
    };

    if (quotations.length === 0) return (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] flex flex-col items-center justify-center py-16 text-center px-6">
            <Clock className="w-12 h-12 text-white/25 mb-4" strokeWidth={1.5} />
            <p className="text-base font-semibold text-white/60 mb-1">Propuesta en preparación</p>
            <p className="text-sm text-white/40">Te notificaremos cuando esté lista.</p>
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Tab selector */}
            {!isApproved && quotations.length > 1 && (
                <div className="flex gap-2 p-1.5 bg-white/[0.04] rounded-2xl border border-white/[0.06] w-fit">
                    {quotations.map(q => (
                        <button key={q.id} onClick={() => setActiveId(q.id)}
                            className={cn('px-5 py-2 rounded-xl text-sm font-semibold transition-all', activeId === q.id ? 'bg-white/[0.1] text-white border border-white/[0.12]' : 'text-white/45 hover:text-white/70')}>
                            {q.optionName}
                        </button>
                    ))}
                </div>
            )}

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white/45 mb-1">{isApproved ? 'Propuesta aprobada' : 'Opción seleccionada'}</p>
                        <h2 className="text-[20px] font-black text-white tracking-tight">{displayQ?.optionName}</h2>
                        {displayQ?.description && <p className="text-sm text-white/55 mt-1 leading-relaxed">{displayQ.description}</p>}
                    </div>
                    <div className="shrink-0 sm:text-right">
                        <p className="text-xs font-bold text-white/45 uppercase tracking-widest mb-0.5">Total</p>
                        <p className="text-4xl font-black text-white tracking-tight">{fmt(displayQ?.total ?? 0, sym)}</p>
                    </div>
                </div>

                {/* Items */}
                {(displayQ?.items?.length ?? 0) > 0 && (
                    <div>
                        <div className="px-6 py-3 border-b border-white/[0.04]">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Desglose</p>
                        </div>
                        {displayQ!.items.map((item, idx) => (
                            <div key={item.id ?? idx} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-white/[0.04] last:border-0 gap-2 hover:bg-white/[0.03] transition-colors">
                                <div>
                                    <p className="text-base font-semibold text-white/90">{item.name}</p>
                                    {item.description && <p className="text-sm text-white/50 mt-0.5">{item.description}</p>}
                                </div>
                                <div className="flex items-center gap-5 sm:justify-end shrink-0">
                                    <span className="text-sm text-white/45">{item.quantity} × {fmt(Number(item.price), sym)}</span>
                                    <span className="text-base font-bold text-white/90 min-w-[80px] text-right">{fmt(Number(item.subtotal), sym)}</span>
                                </div>
                            </div>
                        ))}
                        {(displayQ?.discount ?? 0) > 0 && (
                            <div className="flex justify-end gap-12 px-6 py-3 border-t border-white/[0.05] text-[13px]">
                                <span className="text-white/30">Descuento</span>
                                <span className="text-white/55 font-semibold">−{fmt(displayQ!.discount, sym)}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* CTA / approved */}
                <div className="px-6 py-5 border-t border-white/[0.06]">
                    {isApproved ? (
                        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-4">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-base font-semibold text-emerald-300">Propuesta aprobada</p>
                                <p className="text-sm text-emerald-400/60 mt-0.5">{deal.workspace.businessName ?? 'El equipo'} ya fue notificado.</p>
                            </div>
                        </div>
                    ) : confirming ? (
                        <div className="space-y-3">
                            <p className="text-base font-semibold text-white/90">¿Confirmar aprobación?</p>
                            <p className="text-sm text-white/55 leading-snug">Al aprobar, {deal.workspace.businessName ?? 'el equipo'} recibirá una notificación para proceder.</p>
                            <div className="flex gap-2">
                                <button onClick={handleApprove} disabled={approving}
                                    className="flex-1 h-12 rounded-xl bg-white hover:bg-white/90 text-zinc-900 text-sm font-bold transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                                    {approving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    {approving ? 'Aprobando...' : 'Sí, aprobar'}
                                </button>
                                <button onClick={() => setConfirming(false)} disabled={approving}
                                    className="px-5 h-12 rounded-xl border border-white/[0.15] text-sm font-medium text-white/65 hover:bg-white/[0.07] transition-colors">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setConfirming(true)}
                            className="w-full sm:w-auto px-8 h-13 rounded-2xl bg-white hover:bg-white/90 text-zinc-900 text-base font-bold flex items-center justify-center gap-2 transition-all active:scale-95">
                            <CheckCircle2 className="w-5 h-5" />
                            {quotations.length > 1 ? `Aprobar "${activeQ?.optionName}"` : 'Aprobar esta propuesta'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function PaymentView({ deal }: { deal: DealData }) {
    const isApproved = deal.quotations?.some(q => q.isApproved) ?? false;
    const plan = deal.paymentPlan;
    const approvedQ = deal.quotations?.find(q => q.isApproved);
    const sym = getSymbol(deal, approvedQ);

    if (!isApproved) return (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] flex flex-col items-center justify-center py-16 text-center px-6">
            <Lock className="w-12 h-12 text-white/25 mb-4" />
            <p className="text-base font-semibold text-white/55 mb-1">Disponible tras aprobar</p>
            <p className="text-sm text-white/35">Aprueba la propuesta para ver el plan de pagos.</p>
        </div>
    );

    if (!plan?.milestones?.length) return (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] flex flex-col items-center justify-center py-16 text-center px-6">
            <CreditCard className="w-8 h-8 text-white/15 mb-3" />
            <p className="text-[14px] font-semibold text-white/35">Sin plan de pagos configurado</p>
        </div>
    );

    const totalPaid = plan.milestones.filter(m => m.status === 'PAID').reduce((s, m) => s + m.amount, 0);
    const totalAmount = plan.milestones.reduce((s, m) => s + m.amount, 0);
    const paidPct = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/45 mb-1">Total acordado</p>
                    <p className="text-3xl font-black text-white tracking-tight">{fmt(totalAmount, sym)}</p>
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-white/55">Pagado</p>
                        <p className="text-sm font-bold text-white/80">{paidPct}%</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${paidPct}%` }} />
                    </div>
                </div>
            </div>

            {/* Milestones */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
                {plan.milestones.map((m, i) => {
                    const statusMap: Record<string, { label: string; cls: string }> = {
                        PENDING:   { label: 'Pendiente', cls: 'text-white/30 bg-white/[0.05]' },
                        PAID:      { label: 'Pagado',    cls: 'text-emerald-400 bg-emerald-500/10' },
                        OVERDUE:   { label: 'Vencido',   cls: 'text-red-400 bg-red-500/10' },
                        CANCELLED: { label: 'Cancelado', cls: 'text-white/20 bg-white/[0.03]' },
                    };
                    const s = statusMap[m.status] ?? statusMap['PENDING'];
                    return (
                        <div key={m.id} className="flex items-start justify-between px-5 py-4 border-b border-white/[0.05] last:border-0 gap-4">
                            <div className="flex items-start gap-3">
                                <span className="text-white/40 text-sm font-bold pt-0.5 w-5 shrink-0">{i + 1}.</span>
                                <div>
                                    <p className="text-base font-semibold text-white/90">{m.name}</p>
                                    {m.dueDate && <p className="text-sm text-white/50 mt-0.5 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{fmtDate(m.dueDate)}</p>}
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-base font-bold text-white/90">{fmt(m.amount, sym)}</p>
                                <span className={cn('text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-md', s.cls)}>{s.label}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Project View ─────────────────────────────────────────────────────────────────

function ProjectView({ deal, token }: { deal: DealData; token: string }) {
    const project = deal.project!;
    const [dragOver, setDragOver] = useState(false);
    const [uploads, setUploads] = useState<{ name: string; status: 'uploading' | 'done' | 'error' }[]>([]);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const uploadFile = async (file: File) => {
        const name = file.name;
        setUploads(u => [...u, { name, status: 'uploading' }]);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch(`${API_URL}/public/deals/${token}/upload`, { method: 'POST', body: fd });
            if (!res.ok) throw new Error();
            setUploads(u => u.map(x => x.name === name && x.status === 'uploading' ? { ...x, status: 'done' } : x));
        } catch {
            setUploads(u => u.map(x => x.name === name && x.status === 'uploading' ? { ...x, status: 'error' } : x));
        }
    };

    const handleFiles = (files: FileList) => { Array.from(files).forEach(uploadFile); };

    const statusLabel = project.status === 'COMPLETED' ? 'Completado' : 'En progreso';
    const statusCls = project.status === 'COMPLETED' ? 'text-emerald-400 bg-emerald-500/10' : 'text-blue-400 bg-blue-500/10';

    return (
        <div className="space-y-4">
            {/* Project info */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-white/45 mb-2">Proyecto</p>
                <h2 className="text-xl font-black text-white/95 tracking-tight mb-3">{project.name}</h2>
                <span className={cn('inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg', statusCls)}>
                    {project.status !== 'COMPLETED' && <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                    {statusLabel}
                </span>
            </div>

            {/* Upload zone or placeholder */}
            {project.clientUploadsEnabled ? (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.06]">
                        <p className="text-base font-bold text-white/90">Subir archivos</p>
                        <p className="text-sm text-white/50 mt-0.5">Comparte archivos con tu proveedor de servicios</p>
                    </div>
                    <div className="p-5 space-y-4">
                        {/* Drop zone */}
                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
                            onClick={() => inputRef.current?.click()}
                            className={cn(
                                'border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center select-none',
                                dragOver ? 'border-white/40 bg-white/[0.07]' : 'border-white/[0.1] hover:border-white/[0.22] hover:bg-white/[0.02]',
                            )}
                        >
                            <input ref={inputRef} type="file" multiple className="sr-only" onChange={e => e.target.files && handleFiles(e.target.files)} />
                            <div className={cn('w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 transition-all',
                                dragOver ? 'bg-white/[0.12] border-white/20' : 'bg-white/[0.05] border-white/[0.08]')}>
                                <Upload className={cn('w-5 h-5 transition-colors', dragOver ? 'text-white/60' : 'text-white/30')} />
                            </div>
                            <p className="text-sm font-semibold text-white/70 mb-1">
                                {dragOver ? 'Suelta para subir' : 'Arrastra archivos o haz clic'}
                            </p>
                            <p className="text-xs text-white/40">Cualquier formato · Sin límite de archivos</p>
                        </div>

                        {/* Upload list */}
                        {uploads.length > 0 && (
                            <div className="space-y-2">
                                {uploads.map((u, i) => (
                                    <div key={i} className="flex items-center gap-3 py-2.5 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                                            u.status === 'done' ? 'bg-emerald-500/15' : u.status === 'error' ? 'bg-red-500/15' : 'bg-white/[0.06]')}>
                                            {u.status === 'uploading'
                                                ? <Loader2 className="w-3.5 h-3.5 text-white/30 animate-spin" />
                                                : u.status === 'done'
                                                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                    : <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                                        </div>
                                        <span className="text-[12px] text-white/65 truncate flex-1">{u.name}</span>
                                        <span className={cn('text-[10px] font-bold uppercase tracking-wide shrink-0',
                                            u.status === 'done' ? 'text-emerald-400' : u.status === 'error' ? 'text-red-400' : 'text-white/25')}>
                                            {u.status === 'uploading' ? 'Subiendo…' : u.status === 'done' ? 'Listo' : 'Error'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] flex flex-col items-center justify-center py-14 text-center px-6">
                    <FolderOpen className="w-12 h-12 text-white/25 mb-4" strokeWidth={1.5} />
                    <p className="text-base font-semibold text-white/55 mb-1">Proyecto en curso</p>
                    <p className="text-sm text-white/35">Tu proveedor te contactará con actualizaciones.</p>
                </div>
            )}
        </div>
    );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────────

function Sidebar({ deal, activeNav, onNav, brandColor }: { deal: DealData; activeNav: NavKey; onNav: (k: NavKey) => void; brandColor: string }) {
    const stage = resolveStage(deal);
    const stageIdx = STAGE_STEPS.findIndex(s => s.key === stage);
    const isApproved = deal.quotations?.some(q => q.isApproved) ?? false;

    const navItems: { key: NavKey; label: string; icon: React.ReactNode; locked?: boolean; badge?: string; highlight?: boolean }[] = [
        { key: 'overview', label: 'Resumen', icon: <LayoutDashboard className="w-4 h-4" /> },
        ...(deal.brief ? [{ key: 'brief' as NavKey, label: deal.brief.template.name, icon: <ClipboardList className="w-4 h-4" />, badge: deal.brief.isCompleted ? '✓' : '!' }] : []),
        { key: 'proposal', label: 'Propuesta', icon: <FileText className="w-4 h-4" /> },
        { key: 'payment', label: 'Plan de pagos', icon: <CreditCard className="w-4 h-4" />, locked: !isApproved },
        ...(deal.project ? [{ key: 'project' as NavKey, label: deal.project.name, icon: <Briefcase className="w-4 h-4" />, highlight: true }] : []),
    ];

    return (
        <aside className="w-full lg:w-60 shrink-0 flex flex-col gap-4">
            {/* Workspace card */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                <div className="flex items-center gap-3 mb-3">
                    {deal.workspace.logo ? (
                        <img src={getImageUrl(deal.workspace.logo)} alt="" className="h-8 w-auto max-w-[100px] object-contain" />
                    ) : (
                        <div className="w-9 h-9 rounded-lg bg-white/[0.08] border border-white/[0.1] flex items-center justify-center font-bold text-white text-sm shrink-0">
                            {(deal.workspace.businessName || 'W').charAt(0)}
                        </div>
                    )}
                    <span className="text-sm font-semibold text-white/75 truncate">{deal.workspace.businessName}</span>
                </div>
                <div className="border-t border-white/[0.06] pt-3 space-y-1">
                    <p className="text-xs text-white/45 uppercase tracking-widest font-bold">Cliente</p>
                    <p className="text-base font-semibold text-white/90 truncate">{deal.client.name}</p>
                    {deal.client.email && <p className="text-sm text-white/50 truncate">{deal.client.email}</p>}
                </div>
            </div>

            {/* Mini stepper */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-white/45 mb-3">Etapa actual</p>
                <div className="space-y-3">
                    {STAGE_STEPS.map((s, i) => {
                        const done = i < stageIdx; const active = i === stageIdx;
                        return (
                            <div key={s.key} className="flex items-center gap-3">
                                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold', !done && !active && 'bg-white/[0.06] text-white/25')}
                                    style={done || active ? { backgroundColor: done ? brandColor + 'aa' : brandColor, color: '#fff' } : {}}>
                                    {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                                </div>
                                <span className={cn('text-sm font-semibold', active ? 'text-white' : done ? 'text-white/55' : 'text-white/25')}>{s.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Nav */}
            <nav className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-2 space-y-0.5">
                {navItems.map(item => (
                    <button key={item.key}
                        onClick={() => !item.locked && onNav(item.key)}
                        disabled={item.locked}
                        className={cn(
                            'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors text-left',
                            activeNav === item.key
                                ? item.highlight ? 'bg-blue-500/10 text-blue-300' : 'bg-white/[0.08] text-white'
                                : item.locked ? 'text-white/25 cursor-not-allowed'
                                : item.highlight ? 'text-blue-400/70 hover:text-blue-300 hover:bg-blue-500/[0.06]'
                                : 'text-white/55 hover:text-white/85 hover:bg-white/[0.05]',
                        )}
                    >
                        <span className={cn(
                            activeNav === item.key ? (item.highlight ? 'text-blue-400' : 'text-white/80') : item.locked ? 'text-white/20' : item.highlight ? 'text-blue-400/60' : 'text-white/40'
                        )}>{item.icon}</span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.locked && <Lock className="w-3.5 h-3.5 shrink-0 text-white/25" />}
                        {item.badge && !item.locked && (
                            <span className={cn('text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                                item.badge === '✓' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            )}>{item.badge}</span>
                        )}
                        {item.highlight && !item.locked && (
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
                        )}
                    </button>
                ))}
            </nav>
        </aside>
    );
}

// ─── Password Gate ─────────────────────────────────────────────────────────────

function PasswordGate({ onUnlock }: { onUnlock: (pw: string) => Promise<boolean> }) {
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const submit = async () => {
        if (!input) return;
        setError(false); setLoading(true);
        const ok = await onUnlock(input);
        if (!ok) setError(true);
        setLoading(false);
    };
    return (
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
            <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
                    <KeyRound className="w-6 h-6 text-white/35" />
                </div>
                <h1 className="text-xl font-black text-white mb-1 tracking-tight">Propuesta protegida</h1>
                <p className="text-[13px] text-white/35 mb-6 font-light">Ingresa la contraseña para acceder</p>
                <div className="space-y-3">
                    <input type="password" autoFocus value={input}
                        onChange={e => { setInput(e.target.value); setError(false); }}
                        onKeyDown={e => e.key === 'Enter' && submit()}
                        placeholder="Contraseña"
                        className={cn('w-full rounded-xl border px-4 py-3.5 text-base bg-white/[0.05] text-white placeholder:text-white/30 focus:outline-none transition',
                            error ? 'border-red-500/50' : 'border-white/[0.1] focus:border-white/[0.22]')} />
                    {error && <p className="text-[12px] text-red-400 text-left">Contraseña incorrecta</p>}
                    <button onClick={submit} disabled={!input || loading}
                        className="w-full py-3.5 rounded-xl bg-white hover:bg-white/90 text-zinc-900 text-base font-bold disabled:opacity-40 transition">
                        {loading ? 'Verificando...' : 'Acceder'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────────

export default function PublicDealPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = React.use(params);
    const [deal, setDeal] = useState<DealData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [requiresPassword, setRequiresPassword] = useState(false);
    const [activeNav, setActiveNav] = useState<NavKey>('overview');

    const loadDeal = useCallback(async (password?: string): Promise<boolean> => {
        const url = password ? `${API_URL}/public/deals/${token}?password=${encodeURIComponent(password)}` : `${API_URL}/public/deals/${token}`;
        try {
            const res = await fetch(url);
            if (res.status === 401) { setRequiresPassword(true); return false; }
            if (!res.ok) { setNotFound(true); return false; }
            const json = await res.json();
            setDeal(json.data ?? json);
            setRequiresPassword(false);
            return true;
        } catch { setNotFound(true); return false; }
        finally { setIsLoading(false); }
    }, [token]);

    useEffect(() => { loadDeal(); }, [loadDeal]);

    const updateApproved = (quotationId: string) => {
        setDeal(prev => prev ? { ...prev, quotations: prev.quotations?.map(q => ({ ...q, isApproved: q.id === quotationId })) } : prev);
        setActiveNav('payment');
    };
    const updateBriefDone = () => {
        setDeal(prev => prev ? { ...prev, brief: prev.brief ? { ...prev.brief, isCompleted: true } : prev.brief } : prev);
        setActiveNav('proposal');
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
            <p className="text-[13px] text-white/25 animate-pulse">Cargando...</p>
        </div>
    );
    if (requiresPassword) return <PasswordGate onUnlock={loadDeal} />;
    if (notFound || !deal) return (
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
            <div className="text-center max-w-sm">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center mx-auto mb-5"><FileText className="w-7 h-7 text-white/20" /></div>
                <h1 className="text-xl font-bold text-white mb-2">Propuesta no encontrada</h1>
                <p className="text-[13px] text-white/35 leading-relaxed">El enlace puede haber expirado o ser incorrecto.</p>
            </div>
        </div>
    );

    const brandColor = deal.workspace.brandColor && deal.workspace.brandColor !== '#ffffff' ? deal.workspace.brandColor : '#a1a1aa';

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white font-sans selection:bg-white selection:text-zinc-900">
            <div className="fixed pointer-events-none inset-0" style={{ background: 'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(255,255,255,0.035) 0%, transparent 60%)' }} />

            {/* Top bar */}
            <header className="relative border-b border-white/[0.06] bg-[#0d0d0d]/80 backdrop-blur-xl sticky top-0 z-20 h-14">
                <div className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-3">
                    <span className="text-sm font-semibold text-white/60 truncate">{deal.client.name}</span>
                    <span className="text-white/20 text-sm">/</span>
                    <span className="text-sm font-bold text-white truncate">
                        {activeNav === 'overview' ? 'Resumen'
                            : activeNav === 'brief' ? deal.brief?.template.name
                            : activeNav === 'proposal' ? 'Propuesta'
                            : activeNav === 'project' ? deal.project?.name
                            : 'Plan de pagos'}
                    </span>
                </div>
            </header>

            {/* Dashboard layout */}
            <div className="relative max-w-6xl mx-auto px-4 sm:px-5 py-6 flex flex-col lg:flex-row gap-5 items-start">
                <Sidebar deal={deal} activeNav={activeNav} onNav={setActiveNav} brandColor={brandColor} />

                {/* Main content */}
                <main className="flex-1 min-w-0">
                    {activeNav === 'overview' && <OverviewView deal={deal} brandColor={brandColor} onNav={setActiveNav} />}
                    {activeNav === 'brief' && deal.brief && (
                        deal.brief.isCompleted ? (
                            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] flex flex-col items-center justify-center py-16 text-center px-6">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
                                <p className="text-[15px] font-bold text-emerald-300 mb-1">Brief completado</p>
                                <p className="text-[12px] text-emerald-400/50">Ya enviaste tu cuestionario. ¡Gracias!</p>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
                                <div className="px-5 py-4 border-b border-white/[0.06]">
                                    <h2 className="text-[15px] font-bold text-white/85">{deal.brief.template.name}</h2>
                                    <p className="text-[12px] text-white/35 mt-0.5">Completa este cuestionario para que podamos preparar tu propuesta.</p>
                                </div>
                                <div className="p-5">
                                    <BriefForm deal={deal} onSubmitted={updateBriefDone} />
                                </div>
                            </div>
                        )
                    )}
                    {activeNav === 'proposal' && <ProposalView deal={deal} token={token} onApproved={updateApproved} />}
                    {activeNav === 'payment' && <PaymentView deal={deal} />}
                    {activeNav === 'project' && deal.project && <ProjectView deal={deal} token={token} />}
                </main>
            </div>

            <footer className="relative border-t border-white/[0.05] mt-4">
                <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-2">
                    <p className="text-[10px] font-bold text-white/15 uppercase tracking-widest flex items-center gap-2">
                        Powered by
                        <img src="/HiKrewLogo.png" alt="Hi Krew" className="h-3.5 object-contain opacity-20" style={{ filter: 'brightness(0) invert(1)' }} />
                    </p>
                </div>
            </footer>
        </div>
    );
}
