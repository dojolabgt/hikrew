'use client';

import React, { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { FileText, ArrowRight, Loader2, CheckCircle2, Check, Sparkles, Briefcase, ChevronRight, Building2, Calendar, CreditCard, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

// Reusing base URL from environment
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function PublicDealPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = React.use(params);
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState<string | null>(null);
    const [dealData, setDealData] = useState<any>(null);
    const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);

    useEffect(() => {
        const fetchDeal = async () => {
            try {
                const res = await fetch(`${apiUrl}/public/deals/${token}`);
                if (!res.ok) {
                    if (res.status === 404) return notFound();
                    throw new Error('Error cargando la propuesta');
                }
                const json = await res.json();

                // NestJS Interceptors wrap API response in a `data` object
                const dealRecord = json.data ? json.data : json;
                setDealData(dealRecord);

            } catch (error) {
                console.error(error);
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

            if (!res.ok) throw new Error('No se pudo aprobar la cotización');

            toast.success('¡Propuesta aprobada con éxito!');

            // Reload context
            setDealData((prev: any) => ({
                ...prev,
                status: 'won',
                quotations: prev.quotations.map((q: any) => ({
                    ...q,
                    isApproved: q.id === quotationId
                }))
            }));

            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 300);

        } catch (error) {
            console.error(error);
            toast.error('Hubo un error al aprobar la propuesta');
        } finally {
            setIsApproving(null);
        }
    };

    const handleApproveConfirm = () => {
        if (confirmApproveId) {
            handleApprove(confirmApproveId);
            setConfirmApproveId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mb-4" />
                <p className="text-sm font-medium text-zinc-500 animate-pulse">Preparando la propuesta...</p>
            </div>
        );
    }

    if (!dealData) {
        return notFound();
    }

    const { workspace, quotations = [], status, client } = dealData;
    const isWon = status === 'won';
    const approvedQuotation = quotations.find((q: any) => q.isApproved);
    const isSingleOption = quotations.length === 1;

    // Currency Formatting per quotation
    const fmtFor = (n: number, quotation: any) => {
        let symbol = dealData.currency?.symbol || '$';
        if (quotation?.currency && workspace?.currencies) {
            const found = workspace.currencies.find((c: any) => c.code === quotation.currency);
            if (found) symbol = found.symbol;
            else symbol = quotation.currency; // fallback to code if symbol not found
        }
        return `${symbol}${Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
    };

    if (isWon && approvedQuotation) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400/20 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-zinc-200/50 p-10 text-center border border-zinc-100 relative z-10 animate-in fade-in zoom-in duration-700 spring-bounce hover:scale-[1.02] transition-transform">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-200">
                        <CheckCircle2 className="w-12 h-12 text-emerald-600 drop-shadow-sm" />
                    </div>
                    <h1 className="text-3xl font-black text-zinc-900 mb-3 tracking-tight">¡Propuesta Aceptada!</h1>
                    <p className="text-zinc-500 mb-8 text-lg leading-relaxed">
                        Has elegido la <strong>{approvedQuotation.optionName}</strong>.
                        {workspace?.name && ` El equipo de ${workspace.name} ha sido notificado y se pondrá en contacto contigo pronto para iniciar el proyecto.`}
                    </p>
                    <div className="p-6 bg-gradient-to-b from-zinc-50 to-white rounded-2xl border border-zinc-100 text-center shadow-sm">
                        <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Inversión Acordada</div>
                        <div className="text-4xl font-black tracking-tight text-emerald-600">{fmtFor(approvedQuotation.total, approvedQuotation)}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] selection:bg-black selection:text-white relative">
            {/* Elegant Background Accent */}
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-zinc-200/40 via-zinc-100/20 to-transparent -z-10 pointer-events-none" />

            {/* Premium Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200/80">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {workspace?.logo ? (
                            <img src={workspace.logo} alt={workspace.name} className="h-10 w-auto rounded-lg object-contain" />
                        ) : (
                            <div className="w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-md">
                                {workspace?.name?.charAt(0) || 'B'}
                            </div>
                        )}
                        <div>
                            <span className="font-bold text-lg text-zinc-900 block leading-none">{workspace?.name}</span>
                            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Propuesta Comercial</span>
                        </div>
                    </div>
                    <div className="hidden md:flex text-sm text-zinc-500 items-center gap-2 px-4 py-2 bg-zinc-100 rounded-full font-medium">
                        <Briefcase className="w-4 h-4" />
                        Para: {client?.name || 'Cliente'}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-16 md:py-24">

                {/* Intro Section - Ultra clean */}
                <div className="max-w-3xl mx-auto text-center mb-14 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 text-xs font-semibold text-zinc-500 mb-6 shadow-sm uppercase tracking-widest">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        Propuesta Comercial
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tighter leading-tight mb-5">
                        {dealData.name}
                    </h1>

                    {dealData.validUntil && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50 text-amber-700 text-sm font-medium mb-5 border border-amber-200/50">
                            ⏱️ Oferta válida hasta el {new Date(dealData.validUntil).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    )}

                    {dealData.proposalIntro && (
                        <div className="text-base md:text-lg text-zinc-600 leading-relaxed max-w-3xl mx-auto text-left bg-white p-6 md:p-8 rounded-2xl border border-zinc-200 shadow-sm whitespace-pre-wrap">
                            {dealData.proposalIntro}
                        </div>
                    )}
                </div>

                {/* Quotations Container */}
                {quotations.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[2rem] border border-zinc-200 shadow-sm">
                        <BoxIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-zinc-900 mb-2">Propuesta en elaboración</h3>
                        <p className="text-zinc-500">Aún no hay opciones de cotización disponibles para este proyecto.</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150 fill-mode-both">

                        {/* ─── SINGLE QUOTATION VIEW (Detailed Invoice Style) ─── */}
                        {isSingleOption ? (
                            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-lg shadow-zinc-200/40 max-w-4xl mx-auto">
                                <div className="p-6 md:p-8 border-b border-zinc-100 bg-zinc-50/50 flex flex-col md:flex-row md:items-center justify-between gap-5">
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold text-zinc-900 mb-1.5 tracking-tight">{quotations[0].optionName}</h2>
                                        {quotations[0].description ? (
                                            <p className="text-zinc-500 text-sm leading-relaxed">{quotations[0].description}</p>
                                        ) : null}
                                    </div>
                                    <div className="md:text-right shrink-0 p-4 bg-white rounded-xl border border-zinc-100 shadow-sm">
                                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Inversión Total</div>
                                        <div className="text-2xl font-black tracking-tighter text-zinc-900">{fmtFor(quotations[0].total, quotations[0])}</div>
                                        {Number(quotations[0].discount) > 0 && (
                                            <div className="text-xs font-semibold text-emerald-600 mt-2 bg-emerald-50 inline-block px-3 py-1 rounded-full">
                                                Incluye descuento de {fmtFor(quotations[0].discount, quotations[0])}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Items with price breakdown */}
                                <div className="p-6 md:p-10">
                                    <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-3">
                                        <Building2 className="w-5 h-5 text-zinc-400" />
                                        Desglose de la propuesta
                                    </h3>

                                    {/* Header row */}
                                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 mb-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                                        <div className="col-span-6">Concepto</div>
                                        <div className="col-span-2 text-center">Cant.</div>
                                        <div className="col-span-2 text-right">Precio unit.</div>
                                        <div className="col-span-2 text-right">Subtotal</div>
                                    </div>

                                    <div className="space-y-2">
                                        {quotations[0].items?.map((item: any) => {
                                            const qty = Number(item.quantity || 1);
                                            const price = Number(item.unitPrice || item.price || 0);
                                            const disc = Number(item.discount || 0);
                                            const lineTotal = qty * price * (1 - disc / 100);
                                            return (
                                                <div key={item.id} className="grid grid-cols-12 gap-4 items-start p-4 md:p-5 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-colors group">
                                                    <div className="col-span-12 md:col-span-6">
                                                        <div className="font-bold text-zinc-900 text-sm mb-0.5">{item.name}</div>
                                                        {item.description && <div className="text-zinc-500 text-xs leading-relaxed mt-1">{item.description}</div>}
                                                        {disc > 0 && <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">Descuento: {disc}%</span>}
                                                    </div>
                                                    <div className="col-span-4 md:col-span-2 text-center">
                                                        <span className="text-xs text-zinc-400 md:hidden">Cant. </span>
                                                        <span className="font-medium text-zinc-700">{qty}</span>
                                                    </div>
                                                    <div className="col-span-4 md:col-span-2 text-right">
                                                        <span className="text-xs text-zinc-400 md:hidden">Precio </span>
                                                        <span className="font-medium text-zinc-700">{fmtFor(price, quotations[0])}</span>
                                                    </div>
                                                    <div className="col-span-4 md:col-span-2 text-right">
                                                        <span className="font-bold text-zinc-900">{fmtFor(lineTotal, quotations[0])}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Totals breakdown */}
                                    <div className="mt-6 border-t border-zinc-200 pt-5 space-y-2">
                                        {Number(quotations[0].discount) > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-500">Descuento general</span>
                                                <span className="font-semibold text-emerald-600">-{fmtFor(quotations[0].discount, quotations[0])}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-base font-black pt-1">
                                            <span className="text-zinc-900">Total</span>
                                            <span className="text-zinc-900 text-lg">{fmtFor(quotations[0].total, quotations[0])}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Plan Section */}
                                {dealData.paymentPlan?.milestones?.length > 0 && (
                                    <div className="px-8 md:px-14 pb-10">
                                        <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-3">
                                            <CreditCard className="w-6 h-6 text-zinc-400" />
                                            Plan de Pagos
                                        </h3>
                                        <div className="space-y-3">
                                            {dealData.paymentPlan.milestones.map((m: any, idx: number) => (
                                                <div key={m.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-600 text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</div>
                                                        <div>
                                                            <div className="font-semibold text-zinc-900 text-sm">{m.name}</div>
                                                            {m.dueDate && (
                                                                <div className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(m.dueDate).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-zinc-900">{fmtFor(m.amount, quotations[0])}</div>
                                                        {m.percentage && <div className="text-xs text-zinc-400">{m.percentage}%</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="p-8 md:p-10 bg-zinc-900 flex justify-center md:justify-end">
                                    <button
                                        onClick={() => setConfirmApproveId(quotations[0].id)}
                                        disabled={isApproving === quotations[0].id}
                                        className="w-full md:w-auto h-16 px-10 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-70 shadow-lg"
                                    >
                                        {isApproving === quotations[0].id ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>Aceptar Propuesta <ArrowRight className="w-6 h-6" /></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ─── MULTIPLE QUOTATIONS VIEW (SaaS Pricing Tier Style) ─── */
                            <>
                                <div className="text-center mb-12">
                                    <h2 className="text-3xl font-black text-zinc-900 mb-4 tracking-tight">Selecciona tu plan de inversión</h2>
                                    <p className="text-zinc-500 text-lg">Hemos preparado {quotations.length} opciones adaptadas a tus necesidades.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch justify-center max-w-7xl mx-auto">
                                    {quotations.map((q: any, i: number) => {
                                        // Try to highlight the middle option as "Recommended" if there are 3, or just the second if there are 2
                                        const isFeatured = (quotations.length === 3 && i === 1) || (quotations.length === 2 && i === 1);

                                        return (
                                            <div key={q.id} className={`bg-white rounded-[1.5rem] border ${isFeatured ? 'border-zinc-900 shadow-xl shadow-zinc-900/10 scale-105 z-10' : 'border-zinc-200 shadow-lg shadow-zinc-200/40'} overflow-hidden relative flex flex-col h-full transition-all hover:-translate-y-1`}>

                                                {isFeatured && (
                                                    <div className="bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 text-center w-full absolute top-0 inset-x-0">
                                                        Opción Recomendada
                                                    </div>
                                                )}

                                                {/* Option Header */}
                                                <div className={`p-6 md:p-8 ${isFeatured ? 'pt-10' : ''} border-b border-zinc-100 flex flex-col items-center text-center bg-zinc-50/30`}>
                                                    <h3 className="text-xl font-black text-zinc-900 mb-2">{q.optionName}</h3>
                                                    <div className="min-h-[40px] flex items-center justify-center mb-4">
                                                        {q.description ? (
                                                            <p className="text-zinc-500 text-xs leading-relaxed">{q.description}</p>
                                                        ) : (
                                                            <p className="text-zinc-400 text-xs italic">Opción estándar</p>
                                                        )}
                                                    </div>
                                                    <div className="text-4xl font-black tracking-tighter text-zinc-900 mb-2">
                                                        {fmtFor(q.total, q)}
                                                    </div>
                                                    {Number(q.discount) > 0 ? (
                                                        <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full mt-1">
                                                            Ahorras {fmtFor(q.discount, q)}
                                                        </div>
                                                    ) : (
                                                        <div className="h-6 mt-1"></div>
                                                    )}
                                                </div>

                                                {/* Items List */}
                                                <div className="p-6 md:p-8 flex-1 bg-white">
                                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 text-center">Incluye los siguientes servicios</div>

                                                    {q.items?.length > 0 ? (
                                                        <ul className="space-y-3">
                                                            {q.items.map((item: any) => {
                                                                const qty = Number(item.quantity || 1);
                                                                const price = Number(item.unitPrice || item.price || 0);
                                                                const disc = Number(item.discount || 0);
                                                                const lineTotal = qty * price * (1 - disc / 100);
                                                                return (
                                                                    <li key={item.id} className="flex gap-2.5 items-start">
                                                                        <div className="mt-0.5 w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                                                                            <Check className="w-3 h-3 text-zinc-900" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <div className="flex justify-between items-start gap-2">
                                                                                <div className="font-bold text-zinc-900 text-sm leading-tight">{item.name}</div>
                                                                                {price > 0 && <div className="text-sm font-bold text-zinc-900 shrink-0">{fmtFor(lineTotal, q)}</div>}
                                                                            </div>
                                                                            {item.description && (
                                                                                <div className="text-xs text-zinc-500 leading-relaxed mt-0.5">{item.description}</div>
                                                                            )}
                                                                            {price > 0 && qty > 1 && (
                                                                                <div className="text-xs text-zinc-400 mt-0.5">{qty} × {fmtFor(price, q)}</div>
                                                                            )}
                                                                        </div>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-xs text-zinc-400 italic text-center">No hay ítems detallados en esta opción.</p>
                                                    )}
                                                </div>

                                                {/* Approve Button */}
                                                <div className={`p-6 md:p-8 pt-0 mt-auto bg-white`}>
                                                    <button
                                                        onClick={() => setConfirmApproveId(q.id)}
                                                        disabled={isApproving !== null}
                                                        className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 ${isFeatured ? 'bg-zinc-900 hover:bg-black text-white shadow-lg shadow-zinc-900/20' : 'bg-white border-2 border-zinc-200 hover:border-zinc-900 text-zinc-900'}`}
                                                    >
                                                        {isApproving === q.id ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <>Seleccionar {q.optionName} <ChevronRight className="w-5 h-5" /></>
                                                        )}
                                                    </button>
                                                </div>

                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Terms and Conditions Section */}
                {dealData.proposalTerms && (
                    <div className="mt-20 max-w-4xl mx-auto">
                        <div className="bg-zinc-50 rounded-3xl border border-zinc-200 overflow-hidden">
                            <div className="p-8 border-b border-zinc-200/60 bg-white">
                                <h3 className="text-xl font-bold text-zinc-900">Términos y Condiciones</h3>
                                <p className="text-zinc-500 text-sm mt-1">Acuerdos y notas legales aplicables a esta propuesta comercial.</p>
                            </div>
                            <div className="p-8">
                                <div className="prose prose-zinc max-w-none text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                                    {dealData.proposalTerms}
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-xs text-zinc-400 mt-6">
                            Al hacer clic en "Aceptar Propuesta" (o cualquier botón equivalente) declaras haber leído y estar de acuerdo con los términos estipulados arriba.
                        </p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="py-12 mt-12 bg-white border-t border-zinc-200 text-center">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm font-medium text-zinc-400">
                        Una propuesta profesional enviada por <strong>{workspace?.name}</strong>.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                        <span>Powered by</span>
                        <div className="w-5 h-5 bg-zinc-900 text-white rounded flex items-center justify-center">B</div>
                        <span>Blend</span>
                    </div>
                </div>
            </footer>

            {/* Approve Confirmation Dialog */}
            {confirmApproveId && (() => {
                const q = quotations.find((x: any) => x.id === confirmApproveId);
                return (
                    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 animate-in slide-in-from-bottom-8 duration-300">
                            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="w-8 h-8 text-zinc-700" />
                            </div>
                            <h2 className="text-2xl font-black text-zinc-900 text-center mb-2">¿Confirmar selección?</h2>
                            <p className="text-zinc-500 text-center text-sm mb-2">
                                Estás a punto de aceptar la propuesta
                            </p>
                            <p className="text-center font-bold text-zinc-900 mb-1">{q?.optionName}</p>
                            <p className="text-center text-2xl font-black text-zinc-900 mb-8">{q && fmtFor(q.total, q)}</p>
                            <p className="text-center text-xs text-zinc-400 mb-6">
                                Esta acción notificará al equipo de {workspace?.name} para iniciar el proceso.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmApproveId(null)}
                                    className="flex-1 h-12 rounded-xl border-2 border-zinc-200 text-zinc-700 font-semibold hover:border-zinc-400 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleApproveConfirm}
                                    disabled={!!isApproving}
                                    className="flex-1 h-12 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {isApproving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

function BoxIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    )
}
