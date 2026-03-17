'use client';

import React, { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { ArrowRight, Loader2, CheckCircle2, Sparkles, Calendar, ShieldCheck, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/image-utils';
import { motion } from 'framer-motion';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function PublicDealPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = React.use(params);

    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState<string | null>(null);
    const [dealData, setDealData] = useState<any>(null);
    const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);

    useEffect(() => {
        const fetchDeal = async () => {
            try {
                const res = await fetch(`${apiUrl}/public/deals/${token}`);
                if (!res.ok) {
                    if (res.status === 404) return notFound();
                    throw new Error();
                }
                const json = await res.json();
                const data = json.data ?? json;
                setDealData(data);
                if (data.quotations?.length > 0) setActiveTabId(data.quotations[0].id);
            } catch {
                toast.error('No se pudo cargar la propuesta');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDeal();
    }, [token]);

    const handleApprove = async (quotationId: string) => {
        if (isApproving) return;
        setIsApproving(quotationId);
        try {
            const res = await fetch(`${apiUrl}/public/deals/${token}/approve-quotation/${quotationId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error();
            toast.success('¡Propuesta aprobada!');
            setDealData((prev: any) => ({
                ...prev,
                status: 'won',
                quotations: prev.quotations.map((q: any) => ({ ...q, isApproved: q.id === quotationId })),
            }));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            toast.error('Hubo un error al aprobar la propuesta');
        } finally {
            setIsApproving(null);
            setConfirmApproveId(null);
        }
    };

    // ── Loading ────────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
                <p className="text-[13px] text-white/25 font-light animate-pulse">Cargando propuesta...</p>
            </div>
        );
    }

    if (!dealData) return notFound();

    const { workspace, quotations = [], status, client } = dealData;
    const isWon = status === 'won';
    const approvedQuotation = quotations.find((q: any) => q.isApproved);
    const isSingleOption = quotations.length === 1;
    const activeQ = quotations.find((q: any) => q.id === activeTabId) || quotations[0];
    const isProOrPremium = workspace?.plan === 'pro' || workspace?.plan === 'premium';

    const fmtFor = (n: number, q: any) => {
        let symbol = dealData.currency?.symbol || '$';
        if (q?.currency) {
            const found = workspace?.currencies?.find((c: any) => c.code === q.currency);
            if (found) symbol = found.symbol;
            else {
                const fb: Record<string, string> = {
                    GTQ: 'Q', USD: '$', EUR: '€', MXN: '$', GBP: '£', JPY: '¥',
                    CAD: '$', AUD: '$', CHF: 'Fr', CNY: '¥', BRL: 'R$', COP: '$',
                    ARS: '$', PEN: 'S/', CLP: '$', CRC: '₡', HNL: 'L', NIO: 'C$',
                    DOP: 'RD$', KRW: '₩', INR: '₹',
                };
                symbol = fb[q.currency] || q.currency;
            }
        }
        return `${symbol}${Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
    };

    // ── Success ────────────────────────────────────────────────────────────────
    if (isWon && approvedQuotation) {
        return (
            <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
                {/* Ambient glow */}
                <div className="fixed pointer-events-none" style={{ top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '500px', background: 'radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.06) 0%, transparent 65%)', borderRadius: '50%' }} />

                <motion.div
                    className="relative max-w-md w-full rounded-3xl border border-white/[0.08] bg-white/[0.04] p-10 text-center backdrop-blur-sm"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-3 tracking-tight">¡Propuesta Aceptada!</h1>
                    <p className="text-white/40 mb-8 text-[13px] leading-relaxed font-light">
                        Has elegido <strong className="text-white/70 font-semibold">{approvedQuotation.optionName}</strong>.
                        {workspace?.name && ` El equipo de ${workspace.name} comenzará pronto.`}
                    </p>
                    <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6">
                        <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] mb-2">Inversión Acordada</p>
                        <p className="text-4xl font-black text-white tracking-tight">{fmtFor(approvedQuotation.total, approvedQuotation)}</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ── Quotation content ──────────────────────────────────────────────────────
    const renderQuotation = (q: any) => (
        <div>
            {/* Option header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-white/90 mb-1.5 tracking-tight">{q.optionName}</h2>
                    {q.description && <p className="text-white/40 text-[13px] leading-relaxed font-light">{q.description}</p>}
                </div>
                <div className="shrink-0 md:text-right">
                    <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] mb-1.5">Inversión total</p>
                    <p className="text-4xl font-black text-white tracking-tight">{fmtFor(q.total, q)}</p>
                </div>
            </div>

            {/* Items */}
            {(q.items?.length ?? 0) > 0 && (
                <div className="mb-12">
                    <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Desglose
                    </p>
                    <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
                        {q.items.map((item: any, idx: number) => {
                            const qty = Number(item.quantity || 1);
                            const price = Number(item.unitPrice || item.price || 0);
                            const disc = Number(item.discount || 0);
                            const lineTotal = qty * price * (1 - disc / 100);
                            return (
                                <div key={item.id ?? idx} className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-b border-white/[0.05] last:border-0 gap-3 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex-1">
                                        <p className="font-semibold text-white/80 text-[13px]">{item.name}</p>
                                        {item.description && <p className="text-white/30 text-[11px] mt-0.5 leading-relaxed">{item.description}</p>}
                                    </div>
                                    <div className="flex items-center justify-between md:justify-end gap-6 md:min-w-[240px]">
                                        <span className="text-[13px] text-white/35">
                                            {qty} × {fmtFor(price, q)}
                                            {disc > 0 && <span className="ml-2 text-[10px] font-bold text-white/30 bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08]">−{disc}%</span>}
                                        </span>
                                        <span className="font-bold text-white/85 text-[13px]">{fmtFor(lineTotal, q)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-5 flex flex-col items-end gap-2">
                        {Number(q.discount) > 0 && (
                            <div className="flex justify-between w-full md:w-56 text-[13px]">
                                <span className="text-white/35">Descuento</span>
                                <span className="font-semibold text-white/60">−{fmtFor(q.discount, q)}</span>
                            </div>
                        )}
                        <div className="flex justify-between w-full md:w-56 text-lg font-bold pt-4 border-t border-white/[0.07] mt-1">
                            <span className="text-white/35">Total</span>
                            <span className="text-white">{fmtFor(q.total, q)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment plan */}
            {dealData.paymentPlan?.milestones?.length > 0 && (
                <div className="mb-12">
                    <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/25 inline-block" /> Plan de Pagos
                    </p>
                    <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
                        {dealData.paymentPlan.milestones.map((m: any, idx: number) => (
                            <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-b border-white/[0.05] last:border-0 gap-3 hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-start gap-4">
                                    <span className="text-white/20 text-[11px] font-bold pt-0.5 w-5 shrink-0 tabular-nums">{idx + 1}.</span>
                                    <div>
                                        <p className="font-semibold text-[13px] text-white/80">{m.name}</p>
                                        {m.dueDate && (
                                            <p className="text-[11px] text-white/30 mt-1 flex items-center gap-1.5 font-light">
                                                <Calendar className="w-3 h-3 shrink-0" />
                                                {new Date(m.dueDate).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 pl-9 md:pl-0">
                                    <span className="text-lg font-bold text-white/85">{fmtFor(m.amount, q)}</span>
                                    {m.percentage && <span className="text-[11px] font-semibold text-white/25">{m.percentage}%</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CTA */}
            <div className="pt-8 border-t border-white/[0.06]">
                <button
                    onClick={() => setConfirmApproveId(q.id)}
                    className="w-full md:w-auto px-10 h-11 bg-white hover:bg-gray-100 text-zinc-900 rounded-full font-semibold text-[13px] flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    {isSingleOption ? 'Aceptar Propuesta' : `Aceptar: ${q.optionName}`}
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );

    // ── Main ───────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white selection:bg-white selection:text-zinc-900 font-sans">

            {/* Ambient glows */}
            <div className="fixed pointer-events-none" style={{ top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '600px', background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.045) 0%, transparent 65%)', borderRadius: '50%' }} />
            <div className="fixed pointer-events-none" style={{ bottom: '0', right: '-5%', width: '550px', height: '450px', background: 'radial-gradient(ellipse at 80% 80%, rgba(255,255,255,0.015) 0%, transparent 60%)', borderRadius: '50%' }} />

            <main className="relative max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-24">

                {/* Sender */}
                <motion.div
                    className="flex items-center gap-3.5 mb-14"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                >
                    {isProOrPremium ? (
                        <>
                            {workspace?.logo ? (
                                <img src={getImageUrl(workspace.logo)} alt={workspace.name} className="h-10 w-auto max-w-[100px] object-contain" />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center font-bold text-white text-base shrink-0">
                                    {(workspace?.businessName || workspace?.name || 'B').charAt(0)}
                                </div>
                            )}
                            <div>
                                <p className="font-semibold text-white/85 text-[14px] leading-tight">{workspace?.businessName || workspace?.name}</p>
                                {workspace?.description && <p className="text-[12px] text-white/35 mt-0.5">{workspace.description}</p>}
                            </div>
                        </>
                    ) : (
                        <>
                            <img src="/HiKrewLogo.png" alt="Hi Krew" className="h-8 w-auto object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
                            <p className="font-semibold text-white/85 text-[14px]">Hi Krew</p>
                        </>
                    )}
                </motion.div>

                {/* Hero */}
                <motion.div
                    className="mb-14"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
                >
                    <p className="text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase mb-4">
                        Propuesta Comercial
                    </p>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.07] mb-6">
                        {dealData.name}
                    </h1>
                    <div className="flex flex-wrap gap-2">
                        {client?.name && (
                            <span className="inline-flex items-center text-[12px] text-white/45 bg-white/[0.06] border border-white/[0.08] px-3.5 py-1.5 rounded-full font-medium">
                                Para <strong className="text-white/65 font-semibold ml-1">{client.name}</strong>
                            </span>
                        )}
                        {dealData.validUntil && (
                            <span className="inline-flex items-center gap-1.5 text-[12px] text-white/40 bg-white/[0.06] border border-white/[0.08] px-3.5 py-1.5 rounded-full font-medium">
                                <Clock className="w-3 h-3 shrink-0" />
                                Válida hasta {new Date(dealData.validUntil).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Card */}
                <motion.div
                    className="rounded-3xl border border-white/[0.08] bg-white/[0.03] overflow-hidden backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <div className="p-8 md:p-12">

                        {/* Intro */}
                        {dealData.proposalIntro && (
                            <div className="mb-12 pb-12 border-b border-white/[0.06]">
                                <p className="text-white/50 leading-relaxed whitespace-pre-wrap text-[14px] font-light">{dealData.proposalIntro}</p>
                            </div>
                        )}

                        {/* Quotations */}
                        {quotations.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-5 h-5 text-white/25" />
                                </div>
                                <h3 className="text-[15px] font-semibold text-white/30">Propuesta en elaboración</h3>
                            </div>
                        ) : isSingleOption ? renderQuotation(quotations[0]) : (
                            <div>
                                {/* Tabs */}
                                <div className="flex flex-wrap gap-1.5 mb-10 p-1.5 bg-white/[0.04] rounded-2xl border border-white/[0.07] w-fit">
                                    {quotations.map((q: any) => (
                                        <button
                                            key={q.id}
                                            onClick={() => setActiveTabId(q.id)}
                                            className={`px-4 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${activeTabId === q.id
                                                ? 'bg-white/[0.1] text-white border border-white/[0.12]'
                                                : 'text-white/30 hover:text-white/55'
                                            }`}
                                        >
                                            {q.optionName}
                                        </button>
                                    ))}
                                </div>
                                {activeQ && <div className="animate-in fade-in duration-300">{renderQuotation(activeQ)}</div>}
                            </div>
                        )}

                        {/* Terms */}
                        {dealData.proposalTerms && (
                            <div className="mt-12 pt-12 border-t border-white/[0.06]">
                                <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Términos y Condiciones
                                </p>
                                <p className="text-white/30 text-[13px] leading-relaxed whitespace-pre-wrap font-light">{dealData.proposalTerms}</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Powered by */}
                <div className="mt-10 flex justify-center">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/15 uppercase tracking-widest">
                        Powered by
                        <img src="/HiKrewLogo.png" alt="Hi Krew" className="h-3.5 object-contain ml-1 opacity-25 hover:opacity-50 transition-opacity" style={{ filter: 'brightness(0) invert(1)' }} />
                    </div>
                </div>
            </main>

            {/* Confirm modal */}
            {confirmApproveId && (() => {
                const q = quotations.find((x: any) => x.id === confirmApproveId);
                return (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="w-full max-w-sm rounded-3xl border border-white/[0.1] bg-[#161616] p-8 animate-in zoom-in-95 sm:slide-in-from-bottom-0 slide-in-from-bottom-4 duration-200">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.07] border border-white/[0.09] flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-6 h-6 text-white/50" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl font-black text-center text-white mb-1 tracking-tight">Confirmar selección</h2>
                            <p className="text-white/35 text-center text-[13px] mb-2 font-light">
                                Opción <strong className="text-white/60 font-semibold">{q?.optionName}</strong>
                            </p>
                            <p className="text-center text-4xl font-black text-white mt-5 mb-2 tracking-tight">{q && fmtFor(q.total, q)}</p>
                            <p className="text-center text-[12px] text-white/25 mb-8 leading-relaxed font-light">
                                Al confirmar, notificaremos al equipo para iniciar el proyecto.
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => handleApprove(confirmApproveId)}
                                    disabled={!!isApproving}
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
