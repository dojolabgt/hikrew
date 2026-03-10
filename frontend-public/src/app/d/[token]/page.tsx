'use client';

import React, { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { FileText, ArrowRight, Loader2, CheckCircle2, Check, Sparkles, Briefcase, ChevronRight, Building2, Calendar, CreditCard, AlertTriangle, ShieldCheck, Clock, User } from 'lucide-react';
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
    const [activeTabId, setActiveTabId] = useState<string | null>(null);

    useEffect(() => {
        const fetchDeal = async () => {
            try {
                const res = await fetch(`${apiUrl}/public/deals/${token}`);
                if (!res.ok) {
                    if (res.status === 404) return notFound();
                    throw new Error('Error cargando la propuesta');
                }
                const json = await res.json();
                const dealRecord = json.data ? json.data : json;
                setDealData(dealRecord);
                if (dealRecord.quotations?.length > 0) {
                    setActiveTabId(dealRecord.quotations[0].id);
                }
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
            setConfirmApproveId(null);
        }
    };

    const handleApproveConfirm = () => {
        if (confirmApproveId) {
            handleApprove(confirmApproveId);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-black animate-spin mb-4" />
                <p className="text-sm font-medium text-zinc-500 animate-pulse">Cargando propuesta...</p>
            </div>
        );
    }

    if (!dealData) return notFound();

    const { workspace, quotations = [], status, client } = dealData;
    const isWon = status === 'won';
    const approvedQuotation = quotations.find((q: any) => q.isApproved);
    const isSingleOption = quotations.length === 1;
    const activeTabQuotation = quotations.find((q: any) => q.id === activeTabId) || quotations[0];

    const fmtFor = (n: number, quotation: any) => {
        let symbol = dealData.currency?.symbol || '$';
        if (quotation?.currency) {
            if (workspace?.currencies && workspace.currencies.length > 0) {
                const found = workspace.currencies.find((c: any) => c.code === quotation.currency);
                if (found) symbol = found.symbol;
                else symbol = quotation.currency;
            } else {
                const fallbacks: Record<string, string> = {
                    GTQ: 'Q', USD: '$', EUR: '€', MXN: '$', GBP: '£', JPY: '¥',
                    CAD: '$', AUD: '$', CHF: 'Fr', CNY: '¥', BRL: 'R$', COP: '$',
                    ARS: '$', PEN: 'S/', CLP: '$', CRC: '₡', HNL: 'L', NIO: 'C$',
                    DOP: 'RD$', KRW: '₩', INR: '₹', SAR: '﷼', AED: 'د.إ'
                };
                symbol = fallbacks[quotation.currency] || quotation.currency;
            }
        }
        return `${symbol}${Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
    };

    // --- Success State ---
    if (isWon && approvedQuotation) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-zinc-200/50 p-10 text-center border border-zinc-200 relative z-10">
                    <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-black mb-4 tracking-tight">¡Propuesta Aceptada!</h1>
                    <p className="text-zinc-600 mb-8 text-base leading-relaxed">
                        Has elegido la <strong>{approvedQuotation.optionName}</strong>.
                        {workspace?.name && ` El equipo de ${workspace.name} comenzará a trabajar en ello pronto.`}
                    </p>
                    <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-2">Inversión Acordada</div>
                        <div className="text-4xl font-black tracking-tight text-black">{fmtFor(approvedQuotation.total, approvedQuotation)}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 selection:bg-black selection:text-white font-sans">
            {/* Very clean header */}
            <header className="sticky top-0 z-50 bg-[#FAFAFA]/80 backdrop-blur-xl border-b border-zinc-200/80">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {workspace?.logo ? (
                            <img src={workspace.logo} alt={workspace.name} className="h-10 w-auto rounded object-contain" />
                        ) : (
                            <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center font-bold text-lg">
                                {workspace?.name?.charAt(0) || 'B'}
                            </div>
                        )}
                        <div>
                            <span className="font-semibold text-base text-black block leading-none mb-1">{workspace?.name}</span>
                            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Propuesta Comercial</span>
                        </div>
                    </div>
                    <div className="hidden md:flex text-sm text-zinc-600 items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-full font-medium shadow-sm">
                        <User className="w-4 h-4" />
                        Para {client?.name || 'Cliente'}
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-16 md:py-24">

                {/* Hero / Header Section */}
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight leading-[1.1] mb-6">
                        {dealData.name}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
                        {dealData.validUntil && (
                            <div className="flex items-center gap-2 text-zinc-600 bg-white border border-zinc-200 px-4 py-2 rounded-full shadow-sm">
                                <Clock className="w-4 h-4" />
                                Válida hasta {new Date(dealData.validUntil).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Proposal Intro Markdown */}
                {dealData.proposalIntro && (
                    <div className="bg-white rounded-3xl p-8 md:p-12 mb-16 border border-zinc-200 shadow-sm">
                        <div className="prose prose-zinc max-w-none text-zinc-700 leading-relaxed whitespace-pre-wrap text-base md:text-lg">
                            {dealData.proposalIntro}
                        </div>
                    </div>
                )}

                {/* Quotations Section */}
                {quotations.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200">
                        <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-black mb-2">Propuesta en elaboración</h3>
                        <p className="text-zinc-500">Aún no hay opciones disponibles.</p>
                    </div>
                ) : (
                    <div className="mb-20">
                        {isSingleOption ? (
                            /* --- SINGLE OPTION VIEW --- */
                            <div className="bg-white rounded-3xl border border-zinc-200 shadow-lg shadow-zinc-200/40 overflow-hidden">
                                <div className="p-8 md:p-10 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-50/50">
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-black mb-2">{quotations[0].optionName}</h2>
                                        {quotations[0].description && (
                                            <p className="text-zinc-500 text-sm md:text-base leading-relaxed">{quotations[0].description}</p>
                                        )}
                                    </div>
                                    <div className="md:text-right shrink-0">
                                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Inversión</div>
                                        <div className="text-4xl font-black tracking-tighter text-black">{fmtFor(quotations[0].total, quotations[0])}</div>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="p-8 md:p-10">
                                    <h3 className="text-lg font-bold text-black mb-6">Desglose de la propuesta</h3>
                                    <div className="space-y-4">
                                        <div className="hidden md:grid grid-cols-12 gap-4 pb-3 border-b border-zinc-200 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                            <div className="col-span-6">Servicio</div>
                                            <div className="col-span-2 text-center">Cant.</div>
                                            <div className="col-span-2 text-right">Precio</div>
                                            <div className="col-span-2 text-right">Subtotal</div>
                                        </div>
                                        <div className="space-y-4 md:space-y-0 md:divide-y md:divide-zinc-100">
                                            {quotations[0].items?.map((item: any) => {
                                                const qty = Number(item.quantity || 1);
                                                const price = Number(item.unitPrice || item.price || 0);
                                                const disc = Number(item.discount || 0);
                                                const lineTotal = qty * price * (1 - disc / 100);
                                                return (
                                                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 md:items-center py-4 bg-zinc-50 md:bg-transparent rounded-2xl md:rounded-none px-4 md:px-0 border border-zinc-100 md:border-none">
                                                        <div className="col-span-1 md:col-span-6">
                                                            <div className="font-semibold text-black text-sm">{item.name}</div>
                                                            {item.description && <div className="text-zinc-500 text-sm mt-1 leading-relaxed">{item.description}</div>}
                                                            {disc > 0 && <span className="text-xs font-medium text-black mt-1 inline-block bg-zinc-200 px-2 py-0.5 rounded">Descuento {disc}%</span>}
                                                        </div>
                                                        <div className="col-span-1 md:col-span-2 md:text-center text-sm">
                                                            <span className="text-zinc-500 md:hidden">Cantidad: </span>
                                                            <span className="font-medium text-black">{qty}</span>
                                                        </div>
                                                        <div className="col-span-1 md:col-span-2 md:text-right text-sm">
                                                            <span className="text-zinc-500 md:hidden">Precio: </span>
                                                            <span className="text-zinc-600">{fmtFor(price, quotations[0])}</span>
                                                        </div>
                                                        <div className="col-span-1 md:col-span-2 md:text-right text-sm">
                                                            <span className="font-bold text-black">{fmtFor(lineTotal, quotations[0])}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Totals Summary */}
                                    <div className="mt-8 border-t border-zinc-200 pt-6 flex flex-col items-end space-y-2">
                                        {Number(quotations[0].discount) > 0 && (
                                            <div className="flex justify-between w-full md:w-64 text-sm">
                                                <span className="text-zinc-500">Descuento</span>
                                                <span className="font-semibold text-black">-{fmtFor(quotations[0].discount, quotations[0])}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between w-full md:w-64 text-xl font-bold pt-4 border-t border-zinc-100 mt-2">
                                            <span className="text-black">Total</span>
                                            <span className="text-black">{fmtFor(quotations[0].total, quotations[0])}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Plan */}
                                {dealData.paymentPlan?.milestones?.length > 0 && (
                                    <div className="px-8 md:px-10 pb-10">
                                        <h3 className="text-lg font-bold text-black mb-6">Plan de Pagos</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {dealData.paymentPlan.milestones.map((m: any, idx: number) => (
                                                <div key={m.id} className="p-5 rounded-2xl bg-[#FAFAFA] border border-zinc-200 flex flex-col justify-between">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <div className="font-bold text-sm text-black">{m.name}</div>
                                                            {m.dueDate && (
                                                                <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(m.dueDate).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="w-6 h-6 rounded-full bg-zinc-200 text-black text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</div>
                                                    </div>
                                                    <div className="flex items-end justify-between border-t border-zinc-200 pt-3">
                                                        <div className="text-2xl font-black text-black">{fmtFor(m.amount, quotations[0])}</div>
                                                        {m.percentage && <div className="text-sm font-medium text-zinc-500">{m.percentage}%</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action */}
                                <div className="p-8 md:p-10 bg-zinc-50 border-t border-zinc-100 flex justify-center">
                                    <button
                                        onClick={() => setConfirmApproveId(quotations[0].id)}
                                        className="w-full md:w-auto px-12 h-14 bg-black hover:bg-zinc-800 text-white rounded-full font-bold text-base flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md hover:shadow-xl"
                                    >
                                        Aceptar Propuesta <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* --- MULTIPLE OPTIONS VIEW (TABS) --- */
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-wrap items-center gap-2 p-1.5 bg-zinc-100/80 rounded-2xl">
                                    {quotations.map((q: any) => {
                                        const isActive = activeTabId === q.id;
                                        return (
                                            <button
                                                key={q.id}
                                                onClick={() => setActiveTabId(q.id)}
                                                className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-sm font-bold transition-all ${isActive
                                                    ? 'bg-white text-black shadow-sm border border-zinc-200/50'
                                                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50'
                                                    }`}
                                            >
                                                {q.optionName}
                                            </button>
                                        );
                                    })}
                                </div>

                                {activeTabQuotation && (
                                    <div className="bg-white rounded-3xl border border-zinc-200 shadow-lg shadow-zinc-200/40 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="p-8 md:p-10 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-50/50">
                                            <div className="flex-1">
                                                <h2 className="text-2xl font-bold text-black mb-2">{activeTabQuotation.optionName}</h2>
                                                {activeTabQuotation.description && (
                                                    <p className="text-zinc-500 text-sm md:text-base leading-relaxed">{activeTabQuotation.description}</p>
                                                )}
                                            </div>
                                            <div className="md:text-right shrink-0">
                                                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Inversión</div>
                                                <div className="text-4xl font-black tracking-tighter text-black">{fmtFor(activeTabQuotation.total, activeTabQuotation)}</div>
                                            </div>
                                        </div>

                                        {/* Items */}
                                        <div className="p-8 md:p-10">
                                            <h3 className="text-lg font-bold text-black mb-6">Desglose de la propuesta</h3>
                                            <div className="space-y-4">
                                                <div className="hidden md:grid grid-cols-12 gap-4 pb-3 border-b border-zinc-200 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                                    <div className="col-span-6">Servicio</div>
                                                    <div className="col-span-2 text-center">Cant.</div>
                                                    <div className="col-span-2 text-right">Precio</div>
                                                    <div className="col-span-2 text-right">Subtotal</div>
                                                </div>
                                                <div className="space-y-4 md:space-y-0 md:divide-y md:divide-zinc-100">
                                                    {activeTabQuotation.items?.map((item: any) => {
                                                        const qty = Number(item.quantity || 1);
                                                        const price = Number(item.unitPrice || item.price || 0);
                                                        const disc = Number(item.discount || 0);
                                                        const lineTotal = qty * price * (1 - disc / 100);
                                                        return (
                                                            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 md:items-center py-4 bg-zinc-50 md:bg-transparent rounded-2xl md:rounded-none px-4 md:px-0 border border-zinc-100 md:border-none">
                                                                <div className="col-span-1 md:col-span-6">
                                                                    <div className="font-semibold text-black text-sm">{item.name}</div>
                                                                    {item.description && <div className="text-zinc-500 text-sm mt-1 leading-relaxed">{item.description}</div>}
                                                                    {disc > 0 && <span className="text-xs font-medium text-black mt-1 inline-block bg-zinc-200 px-2 py-0.5 rounded">Descuento {disc}%</span>}
                                                                </div>
                                                                <div className="col-span-1 md:col-span-2 md:text-center text-sm">
                                                                    <span className="text-zinc-500 md:hidden">Cantidad: </span>
                                                                    <span className="font-medium text-black">{qty}</span>
                                                                </div>
                                                                <div className="col-span-1 md:col-span-2 md:text-right text-sm">
                                                                    <span className="text-zinc-500 md:hidden">Precio: </span>
                                                                    <span className="text-zinc-600">{fmtFor(price, activeTabQuotation)}</span>
                                                                </div>
                                                                <div className="col-span-1 md:col-span-2 md:text-right text-sm">
                                                                    <span className="font-bold text-black">{fmtFor(lineTotal, activeTabQuotation)}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Totals Summary */}
                                            <div className="mt-8 border-t border-zinc-200 pt-6 flex flex-col items-end space-y-2">
                                                {Number(activeTabQuotation.discount) > 0 && (
                                                    <div className="flex justify-between w-full md:w-64 text-sm">
                                                        <span className="text-zinc-500">Descuento</span>
                                                        <span className="font-semibold text-black">-{fmtFor(activeTabQuotation.discount, activeTabQuotation)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between w-full md:w-64 text-xl font-bold pt-4 border-t border-zinc-100 mt-2">
                                                    <span className="text-black">Total</span>
                                                    <span className="text-black">{fmtFor(activeTabQuotation.total, activeTabQuotation)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment Plan */}
                                        {dealData.paymentPlan?.milestones?.length > 0 && (
                                            <div className="px-8 md:px-10 pb-10">
                                                <h3 className="text-lg font-bold text-black mb-6">Plan de Pagos</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {dealData.paymentPlan.milestones.map((m: any, idx: number) => (
                                                        <div key={m.id} className="p-5 rounded-2xl bg-[#FAFAFA] border border-zinc-200 flex flex-col justify-between">
                                                            <div className="flex items-start justify-between mb-4">
                                                                <div>
                                                                    <div className="font-bold text-sm text-black">{m.name}</div>
                                                                    {m.dueDate && (
                                                                        <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                                                            <Calendar className="w-3 h-3" />
                                                                            {new Date(m.dueDate).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="w-6 h-6 rounded-full bg-zinc-200 text-black text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</div>
                                                            </div>
                                                            <div className="flex items-end justify-between border-t border-zinc-200 pt-3">
                                                                <div className="text-2xl font-black text-black">{fmtFor(m.amount, activeTabQuotation)}</div>
                                                                {m.percentage && <div className="text-sm font-medium text-zinc-500">{m.percentage}%</div>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action */}
                                        <div className="p-8 md:p-10 bg-zinc-50 border-t border-zinc-100 flex justify-center">
                                            <button
                                                onClick={() => setConfirmApproveId(activeTabQuotation.id)}
                                                className="w-full md:w-auto px-12 h-14 bg-black hover:bg-zinc-800 text-white rounded-full font-bold text-base flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md hover:shadow-xl"
                                            >
                                                Aceptar Opción {activeTabQuotation.optionName} <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Terms and Conditions */}
                {dealData.proposalTerms && (
                    <div className="mt-16 bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
                        <div className="p-8 md:px-12 md:py-8 border-b border-zinc-100 flex items-center gap-4 bg-[#FAFAFA]">
                            <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-zinc-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-black">Términos y Condiciones</h3>
                                <p className="text-zinc-500 text-sm">Consideraciones legales y acuerdos aplicables.</p>
                            </div>
                        </div>
                        <div className="p-8 md:p-12 prose prose-zinc max-w-none text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                            {dealData.proposalTerms}
                        </div>
                    </div>
                )}

            </main>

            <footer className="border-t border-zinc-200 bg-white py-12 text-center mt-10">
                <div className="px-6 flex flex-col items-center gap-4">
                    <p className="text-sm font-medium text-zinc-500">
                        Una propuesta profesional enviada por <strong className="text-black">{workspace?.name}</strong>.
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Powered by
                        <div className="w-5 h-5 bg-black text-white rounded flex items-center justify-center text-xs ml-1">B</div>
                        <span className="text-black">Blend</span>
                    </div>
                </div>
            </footer>

            {/* Confirm Modal */}
            {confirmApproveId && (() => {
                const q = quotations.find((x: any) => x.id === confirmApproveId);
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-8 h-8 text-black" />
                            </div>
                            <h2 className="text-2xl font-black text-center text-black mb-2">Confirmar selección</h2>
                            <p className="text-zinc-500 text-center text-sm mb-6">
                                Estás a punto de confirmar la opción <strong>{q?.optionName}</strong> por un total de
                                <span className="block text-3xl font-black text-black mt-3 mb-2">{q && fmtFor(q.total, q)}</span>
                            </p>
                            <p className="text-center text-xs text-zinc-400 mb-8 leading-relaxed">
                                Al confirmar, notificaremos al equipo para iniciar el proyecto bajo los términos acordados.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmApproveId(null)}
                                    className="flex-1 h-12 rounded-full border border-zinc-200 text-black font-semibold hover:bg-zinc-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleApproveConfirm}
                                    disabled={!!isApproving}
                                    className="flex-1 h-12 rounded-full bg-black hover:bg-zinc-800 text-white font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
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
