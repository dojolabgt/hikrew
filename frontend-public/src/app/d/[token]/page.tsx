'use client';

import React, { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import {
    Loader2, CheckCircle2, Clock, ArrowRight, AlertCircle,
    ShieldCheck, Calendar, Star, ChevronDown, Sparkles, CreditCard,
} from 'lucide-react';
import { getImageUrl } from '@/lib/image-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Types ─────────────────────────────────────────────────────────────────────

type BriefFieldType = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'rating';

type BriefOption = string | { label: string; value: string };

interface BriefField {
    id: string;
    type: BriefFieldType;
    label: string;
    description?: string;
    tooltip?: string;
    required: boolean;
    options?: BriefOption[];
    allowOther?: boolean;
    dependsOn?: { fieldId: string; value: string };
}

function optLabel(opt: BriefOption): string {
    return typeof opt === 'string' ? opt : opt.label;
}
function optValue(opt: BriefOption): string {
    return typeof opt === 'string' ? opt : opt.value;
}

interface QuotationItem {
    id: string;
    name: string;
    description?: string;
    quantity: number;
    price: number;
    subtotal: number;
}

interface Quotation {
    id: string;
    optionName: string;
    description?: string;
    currency?: string;
    isApproved: boolean;
    subtotal: number;
    discount: number;
    taxTotal: number;
    total: number;
    items: QuotationItem[];
}

interface Milestone {
    id: string;
    name: string;
    amount: number;
    percentage?: number;
    dueDate?: string;
    status: string;
}

interface DealData {
    id: string;
    proposalIntro?: string;
    proposalTerms?: string;
    validUntil?: string;
    status?: string;
    client: { id?: string; name: string; email?: string };
    workspace: { businessName?: string; logo?: string; brandColor?: string };
    currency?: { symbol?: string; code?: string };
    brief?: { isCompleted: boolean; publicToken?: string; template: { name: string; schema: BriefField[] } };
    quotations?: Quotation[];
    paymentPlan?: { id: string; milestones: Milestone[] };
}

type PageState = 'brief' | 'waiting' | 'proposal' | 'approved';
type BriefResponses = Record<string, string | string[] | number>;

// ─── Helpers ───────────────────────────────────────────────────────────────────

const CURRENCY_FALLBACKS: Record<string, string> = {
    GTQ: 'Q', USD: '$', EUR: '€', MXN: '$', GBP: '£', JPY: '¥',
    CAD: '$', AUD: '$', BRL: 'R$', COP: '$', ARS: '$',
    PEN: 'S/', CLP: '$', CRC: '₡', HNL: 'L', NIO: 'C$', DOP: 'RD$',
};

function getSymbol(deal: DealData, q?: Quotation) {
    if (q?.currency) return CURRENCY_FALLBACKS[q.currency] ?? q.currency;
    return deal.currency?.symbol ?? '$';
}

function fmt(n: number, sym: string) {
    return `${sym}${Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
}

function fmtDate(iso?: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
}

function resolveState(deal: DealData): PageState {
    const briefExists = !!deal.brief;
    const briefDone = deal.brief?.isCompleted ?? true;
    const hasQ = (deal.quotations?.length ?? 0) > 0;
    const approved = deal.quotations?.some(q => q.isApproved) ?? false;
    if (briefExists && !briefDone) return 'brief';
    if (!hasQ) return 'waiting';
    if (approved) return 'approved';
    return 'proposal';
}

// ─── Input styles ──────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-2.5 text-sm text-white/85 placeholder:text-white/20 focus:outline-none focus:border-white/[0.22] transition-all disabled:opacity-40";

// ─── Brief Form ─────────────────────────────────────────────────────────────────

function BriefForm({ deal, onSubmitted }: {
    deal: DealData;
    onSubmitted: () => void;
}) {
    const schema = deal.brief!.template.schema;
    const [responses, setResponses] = useState<BriefResponses>({});
    const [otherValues, setOtherValues] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const isVisible = (field: BriefField) => {
        if (!field.dependsOn) return true;
        const val = responses[field.dependsOn.fieldId];
        if (Array.isArray(val)) return val.includes(field.dependsOn.value);
        return val === field.dependsOn.value;
    };

    const setResponse = (id: string, val: string | string[] | number) => {
        setResponses(r => ({ ...r, [id]: val }));
        setErrors(e => { const n = { ...e }; delete n[id]; return n; });
    };

    const toggleCheckbox = (id: string, opt: string) => {
        const cur = (responses[id] as string[]) || [];
        setResponse(id, cur.includes(opt) ? cur.filter(v => v !== opt) : [...cur, opt]);
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        schema.filter(isVisible).forEach(f => {
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <div className="mb-8">
                <p className="text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase mb-3">
                    {deal.brief!.template.name}
                </p>
                <h2 className="text-2xl font-bold text-white/90 tracking-tight">Cuéntanos sobre tu proyecto</h2>
                <p className="text-sm text-white/40 mt-1">Completa este cuestionario para que podamos preparar tu propuesta.</p>
            </div>

            {schema.filter(isVisible).map((field) => (
                <div key={field.id} className="space-y-2">
                    <label className="block text-sm font-medium text-white/80">
                        {field.label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    {field.description && (
                        <p className="text-xs text-white/35">{field.description}</p>
                    )}

                    {field.type === 'text' && (
                        <input
                            className={inputCls}
                            value={(responses[field.id] as string) || ''}
                            onChange={e => setResponse(field.id, e.target.value)}
                            placeholder="Tu respuesta..."
                        />
                    )}

                    {field.type === 'textarea' && (
                        <textarea
                            className={inputCls + ' h-28 resize-none'}
                            value={(responses[field.id] as string) || ''}
                            onChange={e => setResponse(field.id, e.target.value)}
                            placeholder="Tu respuesta..."
                        />
                    )}

                    {field.type === 'select' && (
                        <div className="relative">
                            <select
                                className={inputCls + ' appearance-none pr-10 cursor-pointer'}
                                value={(responses[field.id] as string) || ''}
                                onChange={e => setResponse(field.id, e.target.value)}
                            >
                                <option value="" className="bg-zinc-900">Selecciona una opción</option>
                                {field.options?.map(opt => (
                                    <option key={optValue(opt)} value={optValue(opt)} className="bg-zinc-900">{optLabel(opt)}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                        </div>
                    )}

                    {field.type === 'radio' && (
                        <div className="space-y-2">
                            {field.options?.map(opt => (
                                <label key={optValue(opt)} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${responses[field.id] === optValue(opt) ? 'border-white bg-white' : 'border-white/20 group-hover:border-white/40'}`}>
                                        {responses[field.id] === optValue(opt) && <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />}
                                    </div>
                                    <input type="radio" className="sr-only" checked={responses[field.id] === optValue(opt)} onChange={() => setResponse(field.id, optValue(opt))} />
                                    <span className="text-sm text-white/70">{optLabel(opt)}</span>
                                </label>
                            ))}
                            {field.allowOther && (
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${responses[field.id] === '__other__' ? 'border-white bg-white' : 'border-white/20 group-hover:border-white/40'}`}>
                                        {responses[field.id] === '__other__' && <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />}
                                    </div>
                                    <input type="radio" className="sr-only" checked={responses[field.id] === '__other__'} onChange={() => setResponse(field.id, '__other__')} />
                                    <span className="text-sm text-white/40 italic">Otro</span>
                                </label>
                            )}
                            {responses[field.id] === '__other__' && (
                                <input
                                    className={inputCls + ' mt-2'}
                                    value={otherValues[field.id] || ''}
                                    onChange={e => {
                                        setOtherValues(v => ({ ...v, [field.id]: e.target.value }));
                                        setResponse(field.id, e.target.value || '__other__');
                                    }}
                                    placeholder="Especifica..."
                                />
                            )}
                        </div>
                    )}

                    {field.type === 'checkbox' && (
                        <div className="space-y-2">
                            {field.options?.map(opt => {
                                const val = optValue(opt);
                                const checked = ((responses[field.id] as string[]) || []).includes(val);
                                return (
                                    <label key={val} className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${checked ? 'border-white bg-white' : 'border-white/20 group-hover:border-white/40'}`}>
                                            {checked && <svg className="w-2.5 h-2.5 text-zinc-900" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                        </div>
                                        <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleCheckbox(field.id, val)} />
                                        <span className="text-sm text-white/70">{optLabel(opt)}</span>
                                    </label>
                                );
                            })}
                        </div>
                    )}

                    {field.type === 'rating' && (
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(n => (
                                <button key={n} type="button" onClick={() => setResponse(field.id, n)} className="focus:outline-none">
                                    <Star className={`w-7 h-7 transition-colors ${Number(responses[field.id]) >= n ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`} />
                                </button>
                            ))}
                        </div>
                    )}

                    {errors[field.id] && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> {errors[field.id]}
                        </p>
                    )}
                </div>
            ))}

            {submitError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-400">{submitError}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-full bg-white hover:bg-gray-100 text-zinc-900 font-semibold text-[13px] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 mt-4"
            >
                {isSubmitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                    : <>Enviar cuestionario <ArrowRight className="w-3.5 h-3.5" /></>
                }
            </button>
        </form>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PublicDealPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = React.use(params);

    const [deal, setDeal] = useState<DealData | null>(null);
    const [pageState, setPageState] = useState<PageState>('waiting');
    const [isLoading, setIsLoading] = useState(true);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);
    const [isApproving, setIsApproving] = useState(false);
    const [briefSubmitted, setBriefSubmitted] = useState(false);

    const loadDeal = async () => {
        try {
            const res = await fetch(`${API_URL}/public/deals/${token}`);
            if (!res.ok) {
                if (res.status === 404) return notFound();
                throw new Error();
            }
            const json = await res.json();
            const data: DealData = json.data ?? json;
            setDeal(data);
            const state = resolveState(data);
            setPageState(briefSubmitted ? 'waiting' : state);
            if (data.quotations?.length) setActiveTabId(data.quotations[0].id);
        } catch {
            // handled by notFound
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadDeal(); }, [token]);

    const handleBriefSubmitted = () => {
        setBriefSubmitted(true);
        setPageState('waiting');
    };

    const handleApprove = async (quotationId: string) => {
        if (!deal || isApproving) return;
        setIsApproving(true);
        try {
            const res = await fetch(`${API_URL}/public/deals/${token}/approve-quotation/${quotationId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error();
            setDeal(prev => prev ? {
                ...prev,
                quotations: prev.quotations?.map(q => ({ ...q, isApproved: q.id === quotationId })),
            } : prev);
            setPageState('approved');
            setConfirmApproveId(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            // silent — user can retry
        } finally {
            setIsApproving(false);
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
                <p className="text-[13px] text-white/25 animate-pulse">Cargando...</p>
            </div>
        );
    }

    if (!deal) return notFound();

    const { workspace, client, quotations = [], paymentPlan, proposalIntro, proposalTerms, validUntil } = deal;
    const approvedQ = quotations.find(q => q.isApproved);
    const activeQ = quotations.find(q => q.id === activeTabId) ?? quotations[0];
    const sym = getSymbol(deal, activeQ);
    const brandColor = workspace.brandColor || '#ffffff';

    // ── Shared header ────────────────────────────────────────────────────────

    const Header = () => (
        <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
                {workspace.logo ? (
                    <img src={getImageUrl(workspace.logo)} alt={workspace.businessName} className="h-9 w-auto max-w-[120px] object-contain" />
                ) : (
                    <div className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center font-bold text-white text-sm shrink-0">
                        {(workspace.businessName || 'W').charAt(0)}
                    </div>
                )}
                <span className="font-semibold text-white/80 text-sm">{workspace.businessName}</span>
            </div>
            {validUntil && (
                <span className="text-[11px] text-white/30 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Válida hasta {fmtDate(validUntil)}
                </span>
            )}
        </div>
    );

    // ── Brief state ──────────────────────────────────────────────────────────

    if (pageState === 'brief' && deal.brief && !deal.brief.isCompleted) {
        return (
            <div className="min-h-screen bg-[#0d0d0d] text-white font-sans selection:bg-white selection:text-zinc-900">
                <div className="fixed pointer-events-none inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 70%)' }} />
                <main className="relative max-w-2xl mx-auto px-5 sm:px-6 py-14">
                    <Header />
                    <BriefForm deal={deal} onSubmitted={handleBriefSubmitted} />
                </main>
            </div>
        );
    }

    // ── Waiting state ────────────────────────────────────────────────────────

    if (pageState === 'waiting') {
        return (
            <div className="min-h-screen bg-[#0d0d0d] text-white font-sans flex flex-col items-center justify-center p-6">
                <div className="fixed pointer-events-none inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 70%)' }} />
                <div className="relative max-w-sm text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mx-auto">
                        <Clock className="w-7 h-7 text-white/30" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Propuesta en preparación</h2>
                    <p className="text-sm text-white/40 leading-relaxed">
                        {briefSubmitted
                            ? 'Gracias por completar el cuestionario. Estamos preparando tu propuesta.'
                            : 'Estamos preparando tu propuesta personalizada. Te notificaremos cuando esté lista.'}
                    </p>
                    {workspace.businessName && (
                        <p className="text-xs text-white/25">{workspace.businessName}</p>
                    )}
                </div>
            </div>
        );
    }

    // ── Approved state ───────────────────────────────────────────────────────

    if (pageState === 'approved' && approvedQ) {
        return (
            <div className="min-h-screen bg-[#0d0d0d] text-white font-sans flex items-center justify-center p-6">
                <div className="fixed pointer-events-none inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(52,211,153,0.06) 0%, transparent 70%)' }} />
                <div className="relative max-w-md w-full rounded-3xl border border-white/[0.08] bg-white/[0.04] p-10 text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-7">
                        <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-3 tracking-tight">¡Propuesta Aceptada!</h1>
                    <p className="text-white/40 text-[13px] leading-relaxed mb-7 font-light">
                        Has elegido <strong className="text-white/70 font-semibold">{approvedQ.optionName}</strong>.
                        {workspace.businessName && ` El equipo de ${workspace.businessName} comenzará pronto.`}
                    </p>
                    <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6 mb-7">
                        <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] mb-2">Inversión Acordada</p>
                        <p className="text-4xl font-black text-white tracking-tight">{fmt(approvedQ.total, getSymbol(deal, approvedQ))}</p>
                    </div>

                    {/* Payment plan in approved state */}
                    {paymentPlan?.milestones && paymentPlan.milestones.length > 0 && (
                        <div className="text-left">
                            <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <CreditCard className="w-3.5 h-3.5" /> Plan de Pagos
                            </p>
                            <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
                                {paymentPlan.milestones.map((m, idx) => (
                                    <div key={m.id} className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05] last:border-0">
                                        <div className="flex items-center gap-3">
                                            <span className="text-white/20 text-xs font-bold w-4">{idx + 1}.</span>
                                            <div>
                                                <p className="text-[13px] font-medium text-white/75">{m.name}</p>
                                                {m.dueDate && <p className="text-[11px] text-white/30 mt-0.5">{fmtDate(m.dueDate)}</p>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[13px] font-bold text-white/80">{fmt(m.amount, getSymbol(deal, approvedQ))}</p>
                                            {m.percentage && <p className="text-[10px] text-white/25">{m.percentage}%</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Proposal state ───────────────────────────────────────────────────────

    const renderQuotation = (q: Quotation) => {
        const s = getSymbol(deal, q);
        return (
            <div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <h2 className="text-xl font-bold text-white/90 mb-1 tracking-tight">{q.optionName}</h2>
                        {q.description && <p className="text-white/40 text-[13px] leading-relaxed font-light">{q.description}</p>}
                    </div>
                    <div className="shrink-0 md:text-right">
                        <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] mb-1">Inversión total</p>
                        <p className="text-4xl font-black text-white tracking-tight">{fmt(q.total, s)}</p>
                    </div>
                </div>

                {q.items.length > 0 && (
                    <div className="mb-10">
                        <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> Desglose
                        </p>
                        <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
                            {q.items.map((item, idx) => (
                                <div key={item.id ?? idx} className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-b border-white/[0.05] last:border-0 gap-3 hover:bg-white/[0.02] transition-colors">
                                    <div>
                                        <p className="font-semibold text-white/80 text-[13px]">{item.name}</p>
                                        {item.description && <p className="text-white/30 text-[11px] mt-0.5">{item.description}</p>}
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="text-[13px] text-white/35">{item.quantity} × {fmt(item.price, s)}</span>
                                        <span className="font-bold text-white/85 text-[13px]">{fmt(item.subtotal, s)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex flex-col items-end gap-2">
                            {q.discount > 0 && (
                                <div className="flex justify-between w-56 text-[13px]">
                                    <span className="text-white/35">Descuento</span>
                                    <span className="text-white/60 font-semibold">−{fmt(q.discount, s)}</span>
                                </div>
                            )}
                            <div className="flex justify-between w-56 text-base font-bold pt-3 border-t border-white/[0.07] mt-1">
                                <span className="text-white/35">Total</span>
                                <span className="text-white">{fmt(q.total, s)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {paymentPlan?.milestones && paymentPlan.milestones.length > 0 && (
                    <div className="mb-10">
                        <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <CreditCard className="w-3 h-3" /> Plan de Pagos
                        </p>
                        <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
                            {paymentPlan.milestones.map((m, idx) => (
                                <div key={m.id} className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] last:border-0">
                                    <div className="flex items-start gap-4">
                                        <span className="text-white/20 text-[11px] font-bold pt-0.5 w-4 shrink-0">{idx + 1}.</span>
                                        <div>
                                            <p className="font-semibold text-[13px] text-white/80">{m.name}</p>
                                            {m.dueDate && (
                                                <p className="text-[11px] text-white/30 mt-0.5 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> {fmtDate(m.dueDate)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-white/80">{fmt(m.amount, s)}</p>
                                        {m.percentage && <p className="text-[10px] text-white/25">{m.percentage}%</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="pt-6 border-t border-white/[0.06]">
                    <button
                        onClick={() => setConfirmApproveId(q.id)}
                        style={{ backgroundColor: brandColor !== '#ffffff' ? brandColor : undefined }}
                        className="w-full md:w-auto px-10 h-11 bg-white hover:opacity-90 text-zinc-900 rounded-full font-semibold text-[13px] flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        {quotations.length === 1 ? 'Aceptar Propuesta' : `Aceptar: ${q.optionName}`}
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white selection:bg-white selection:text-zinc-900 font-sans">
            <div className="fixed pointer-events-none" style={{ top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '600px', background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.045) 0%, transparent 65%)', borderRadius: '50%' }} />

            <main className="relative max-w-3xl mx-auto px-4 sm:px-6 py-14 md:py-20">
                <Header />

                {/* Hero */}
                <div className="mb-12">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase mb-3">Propuesta Comercial</p>
                    <div className="flex flex-wrap gap-2">
                        {client?.name && (
                            <span className="inline-flex items-center text-[12px] text-white/45 bg-white/[0.06] border border-white/[0.08] px-3.5 py-1.5 rounded-full">
                                Para <strong className="text-white/65 ml-1">{client.name}</strong>
                            </span>
                        )}
                    </div>
                </div>

                {/* Card */}
                <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
                    <div className="p-7 md:p-10">
                        {proposalIntro && (
                            <div className="mb-10 pb-10 border-b border-white/[0.06]">
                                <p className="text-white/50 leading-relaxed whitespace-pre-wrap text-[14px] font-light">{proposalIntro}</p>
                            </div>
                        )}

                        {quotations.length === 0 ? (
                            <div className="text-center py-20">
                                <Clock className="w-10 h-10 text-white/20 mx-auto mb-4" strokeWidth={1.5} />
                                <p className="text-white/30">Propuesta en preparación</p>
                            </div>
                        ) : quotations.length === 1 ? (
                            renderQuotation(quotations[0])
                        ) : (
                            <div>
                                <div className="flex flex-wrap gap-1.5 mb-8 p-1.5 bg-white/[0.04] rounded-2xl border border-white/[0.07] w-fit">
                                    {quotations.map(q => (
                                        <button
                                            key={q.id}
                                            onClick={() => setActiveTabId(q.id)}
                                            className={`px-4 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${activeTabId === q.id ? 'bg-white/[0.1] text-white border border-white/[0.12]' : 'text-white/30 hover:text-white/55'}`}
                                        >
                                            {q.optionName}
                                        </button>
                                    ))}
                                </div>
                                {activeQ && renderQuotation(activeQ)}
                            </div>
                        )}

                        {proposalTerms && (
                            <div className="mt-10 pt-10 border-t border-white/[0.06]">
                                <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Términos y Condiciones
                                </p>
                                <p className="text-white/30 text-[13px] leading-relaxed whitespace-pre-wrap font-light">{proposalTerms}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <p className="text-[10px] font-bold text-white/15 uppercase tracking-widest flex items-center gap-2">
                        Powered by
                        <img src="/HiKrewLogo.png" alt="Hi Krew" className="h-3.5 object-contain opacity-25" style={{ filter: 'brightness(0) invert(1)' }} />
                    </p>
                </div>
            </main>

            {/* Confirm modal */}
            {confirmApproveId && (() => {
                const q = quotations.find(x => x.id === confirmApproveId);
                if (!q) return null;
                return (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <div className="w-full max-w-sm rounded-3xl border border-white/[0.1] bg-[#161616] p-8">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.07] border border-white/[0.09] flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-6 h-6 text-white/50" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl font-black text-center text-white mb-1 tracking-tight">Confirmar selección</h2>
                            <p className="text-white/35 text-center text-[13px] mb-2 font-light">
                                Opción <strong className="text-white/60 font-semibold">{q.optionName}</strong>
                            </p>
                            <p className="text-center text-4xl font-black text-white mt-5 mb-2 tracking-tight">
                                {fmt(q.total, getSymbol(deal, q))}
                            </p>
                            <p className="text-center text-[12px] text-white/25 mb-8 leading-relaxed font-light">
                                Al confirmar, notificaremos al equipo para iniciar el proyecto.
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => handleApprove(confirmApproveId)}
                                    disabled={isApproving}
                                    className="w-full h-11 rounded-full bg-white hover:bg-gray-100 text-zinc-900 font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-2 text-[13px]"
                                >
                                    {isApproving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar y Aceptar'}
                                </button>
                                <button
                                    onClick={() => setConfirmApproveId(null)}
                                    className="w-full h-10 rounded-full text-white/30 font-semibold hover:bg-white/[0.05] hover:text-white/55 transition-colors text-[13px]"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
