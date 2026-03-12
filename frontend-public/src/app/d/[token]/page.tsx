'use client';

import React, { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { FileText, ArrowRight, Loader2, CheckCircle2, Sparkles, Calendar, ShieldCheck, Clock, User, Star } from 'lucide-react';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/image-utils';

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
            <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg shadow-zinc-200/50 p-10 text-center border border-zinc-200 relative z-10">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 mb-4 tracking-tight">¡Propuesta Aceptada!</h1>
                    <p className="text-zinc-500 mb-8 text-base leading-relaxed">
                        Has elegido la opción <strong>{approvedQuotation.optionName}</strong>.
                        {workspace?.name && ` El equipo de ${workspace.name} comenzará a trabajar en ello pronto.`}
                    </p>
                    <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                            Inversión Acordada
                        </div>
                        <div className="text-4xl font-bold tracking-tight text-zinc-900">{fmtFor(approvedQuotation.total, approvedQuotation)}</div>
                    </div>
                </div>
            </div>
        );
    }

    const isProOrPremium = workspace?.plan === 'pro' || workspace?.plan === 'premium';

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 selection:bg-black selection:text-white font-sans">
            {/* Very clean header */}
            <header className="sticky top-0 z-50 bg-[#FAFAFA]/80 backdrop-blur-xl border-b border-zinc-200/80">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {isProOrPremium ? (
                            workspace?.logo ? (
                                <img src={getImageUrl(workspace.logo)} alt={workspace.name || "Workspace"} className="h-10 w-auto rounded object-contain" />
                            ) : (
                                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-lg">
                                    {workspace?.name?.charAt(0) || 'B'}
                                </div>
                            )
                        ) : (
                            <img src="/NodallyLogo.png" alt="Nodally" className="h-8 w-auto object-contain" />
                        )}
                        <div>
                            <span className="font-semibold text-base text-black block leading-none mb-1.5">
                                {isProOrPremium ? workspace?.name : 'Nodally'}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-zinc-600 uppercase tracking-widest bg-zinc-100 px-2 py-0.5 rounded-full w-max">
                                <Sparkles className="w-3 h-3 text-zinc-400" />
                                <span>Propuesta Comercial</span>
                                <Sparkles className="w-3 h-3 text-zinc-400" />
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:flex text-sm text-zinc-600 items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-full font-medium shadow-sm">
                        <User className="w-4 h-4" />
                        Para {client?.name || 'Cliente'}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
                <div className="bg-white rounded-2xl md:rounded-[32px] shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="p-8 md:p-14 lg:p-16">
                        {/* Hero / Header Section */}
                        <div className="mb-16">
                            <div className="flex mb-6">
                                <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 uppercase tracking-widest bg-zinc-100 px-3 py-1.5 rounded-md">
                                    <Star className="w-3 h-3 fill-zinc-800 text-zinc-800" />
                                    Propuesta
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 tracking-tight leading-[1.1] mb-6">
                                {dealData.name}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                                {dealData.validUntil && (
                                    <div className="flex items-center gap-2 text-zinc-600 bg-zinc-50 border border-zinc-200 px-4 py-2 rounded-lg shadow-sm">
                                        <Clock className="w-4 h-4" />
                                        Válida hasta {new Date(dealData.validUntil).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Proposal Intro Markdown */}
                        {dealData.proposalIntro && (
                            <div className="mb-16">
                                <div className="prose prose-sm md:prose-base prose-zinc max-w-none text-zinc-700 leading-relaxed whitespace-pre-wrap">
                                    {dealData.proposalIntro}
                                </div>
                            </div>
                        )}

                        {/* Quotations Section */}
                        {quotations.length === 0 ? (
                            <div className="text-center py-20 border-t border-zinc-100">
                                <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-zinc-900 mb-2">Propuesta en elaboración</h3>
                                <p className="text-zinc-500">Aún no hay opciones disponibles.</p>
                            </div>
                        ) : (
                            <div className="mb-16 border-t border-zinc-100 pt-16">
                                {isSingleOption ? (
                                    /* --- SINGLE OPTION VIEW --- */
                                    <div>
                                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                                            <div className="flex-1">
                                                <h2 className="text-2xl font-bold text-zinc-900 mb-2">{quotations[0].optionName}</h2>
                                                {quotations[0].description && (
                                                    <p className="text-zinc-500 text-sm md:text-base leading-relaxed">{quotations[0].description}</p>
                                                )}
                                            </div>
                                            <div className="md:text-right shrink-0">
                                                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Inversión</div>
                                                <div className="text-4xl font-bold tracking-tight text-zinc-900">{fmtFor(quotations[0].total, quotations[0])}</div>
                                            </div>
                                        </div>

                                        {/* Items */}
                                        <div className="mb-12">
                                            <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-zinc-400" />
                                                Desglose de la propuesta
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex flex-col">
                                                    {quotations[0].items?.map((item: any) => {
                                                        const qty = Number(item.quantity || 1);
                                                        const price = Number(item.unitPrice || item.price || 0);
                                                        const disc = Number(item.discount || 0);
                                                        const lineTotal = qty * price * (1 - disc / 100);
                                                        return (
                                                            <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-zinc-100 last:border-0 gap-3">
                                                                <div className="md:flex-1">
                                                                    <div className="font-semibold text-zinc-900 text-sm">{item.name}</div>
                                                                    {item.description && <div className="text-zinc-500 text-sm mt-1 leading-relaxed">{item.description}</div>}
                                                                </div>
                                                                <div className="flex flex-row items-center justify-between md:justify-end gap-6 md:min-w-[300px]">
                                                                    <div className="text-sm text-zinc-500">
                                                                        {qty} x {fmtFor(price, quotations[0])}
                                                                        {disc > 0 && <span className="ml-2 text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">-{disc}%</span>}
                                                                    </div>
                                                                    <div className="font-bold text-zinc-900 text-sm md:text-right w-24">{fmtFor(lineTotal, quotations[0])}</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="mt-8 border-t border-zinc-200 pt-6 flex flex-col items-end space-y-2">
                                                {Number(quotations[0].discount) > 0 && (
                                                    <div className="flex justify-between w-full md:w-64 text-sm">
                                                        <span className="text-zinc-500">Descuento</span>
                                                        <span className="font-semibold text-zinc-900">-{fmtFor(quotations[0].discount, quotations[0])}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between w-full md:w-64 text-xl font-bold pt-4 border-t border-zinc-100 mt-2">
                                                    <span className="text-zinc-900">Total</span>
                                                    <span className="text-zinc-900">{fmtFor(quotations[0].total, quotations[0])}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment Plan */}
                                        {dealData.paymentPlan?.milestones?.length > 0 && (
                                            <div className="mb-12">
                                                <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                                                    Plan de Pagos
                                                </h3>
                                                <div className="space-y-0">
                                                    {dealData.paymentPlan.milestones.map((m: any, idx: number) => (
                                                        <div key={m.id} className="py-4 border-b border-zinc-100 last:border-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                            <div className="flex items-start gap-4">
                                                                <div className="w-6 text-zinc-400 text-xs font-bold pt-0.5">{idx + 1}.</div>
                                                                <div>
                                                                    <div className="font-semibold text-sm text-zinc-900">{m.name}</div>
                                                                    {m.dueDate && (
                                                                        <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                                                            <Calendar className="w-3 h-3" />
                                                                            {new Date(m.dueDate).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4 pl-10 md:pl-0">
                                                                <div className="text-lg font-bold text-zinc-900">{fmtFor(m.amount, quotations[0])}</div>
                                                                {m.percentage && <div className="text-xs font-bold text-zinc-500">{m.percentage}%</div>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action */}
                                        <div className="flex justify-start pt-6 border-t border-zinc-100">
                                            <button
                                                onClick={() => setConfirmApproveId(quotations[0].id)}
                                                className="w-full md:w-auto px-8 h-12 bg-zinc-900 hover:bg-black text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-md shadow-zinc-900/10"
                                            >
                                                <span>Aceptar Propuesta</span>
                                                <ArrowRight className="w-4 h-4 text-white/70" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* --- MULTIPLE OPTIONS VIEW (TABS) --- */
                                    <div className="flex flex-col gap-10">
                                        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-zinc-100 pb-px">
                                            {quotations.map((q: any) => {
                                                const isActive = activeTabId === q.id;
                                                return (
                                                    <button
                                                        key={q.id}
                                                        onClick={() => setActiveTabId(q.id)}
                                                        className={`pb-3 px-1 text-sm font-semibold transition-all border-b-2 relative -mb-px ${isActive
                                                            ? 'text-zinc-900 border-zinc-900'
                                                            : 'text-zinc-400 border-transparent hover:text-zinc-700 hover:border-zinc-300'
                                                            }`}
                                                    >
                                                        {q.optionName}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {activeTabQuotation && (
                                            <div className="animate-in fade-in duration-500">
                                                <div>
                                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                                                        <div className="flex-1">
                                                            <h2 className="text-2xl font-bold text-zinc-900 mb-2">{activeTabQuotation.optionName}</h2>
                                                            {activeTabQuotation.description && (
                                                                <p className="text-zinc-500 text-sm md:text-base leading-relaxed">{activeTabQuotation.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="md:text-right shrink-0">
                                                            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Inversión</div>
                                                            <div className="text-4xl font-bold tracking-tight text-zinc-900">{fmtFor(activeTabQuotation.total, activeTabQuotation)}</div>
                                                        </div>
                                                    </div>

                                                    {/* Items */}
                                                    <div className="mb-12">
                                                        <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                                                            <Sparkles className="w-4 h-4 text-zinc-400" />
                                                            Desglose de la propuesta
                                                        </h3>
                                                        <div className="space-y-4">
                                                            <div className="flex flex-col">
                                                                {activeTabQuotation.items?.map((item: any) => {
                                                                    const qty = Number(item.quantity || 1);
                                                                    const price = Number(item.unitPrice || item.price || 0);
                                                                    const disc = Number(item.discount || 0);
                                                                    const lineTotal = qty * price * (1 - disc / 100);
                                                                    return (
                                                                        <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-zinc-100 last:border-0 gap-3">
                                                                            <div className="md:flex-1">
                                                                                <div className="font-semibold text-zinc-900 text-sm">{item.name}</div>
                                                                                {item.description && <div className="text-zinc-500 text-sm mt-1 leading-relaxed">{item.description}</div>}
                                                                            </div>
                                                                            <div className="flex flex-row items-center justify-between md:justify-end gap-6 md:min-w-[300px]">
                                                                                <div className="text-sm text-zinc-500">
                                                                                    {qty} x {fmtFor(price, activeTabQuotation)}
                                                                                    {disc > 0 && <span className="ml-2 text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">-{disc}%</span>}
                                                                                </div>
                                                                                <div className="font-bold text-zinc-900 text-sm md:text-right w-24">{fmtFor(lineTotal, activeTabQuotation)}</div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        <div className="mt-8 border-t border-zinc-200 pt-6 flex flex-col items-end space-y-2">
                                                            {Number(activeTabQuotation.discount) > 0 && (
                                                                <div className="flex justify-between w-full md:w-64 text-sm">
                                                                    <span className="text-zinc-500">Descuento</span>
                                                                    <span className="font-semibold text-zinc-900">-{fmtFor(activeTabQuotation.discount, activeTabQuotation)}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between w-full md:w-64 text-xl font-bold pt-4 border-t border-zinc-100 mt-2">
                                                                <span className="text-zinc-900">Total</span>
                                                                <span className="text-zinc-900">{fmtFor(activeTabQuotation.total, activeTabQuotation)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Payment Plan */}
                                                    {dealData.paymentPlan?.milestones?.length > 0 && (
                                                        <div className="mb-12">
                                                            <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                                                                Plan de Pagos
                                                            </h3>
                                                            <div className="space-y-0">
                                                                {dealData.paymentPlan.milestones.map((m: any, idx: number) => (
                                                                    <div key={m.id} className="py-4 border-b border-zinc-100 last:border-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                                        <div className="flex items-start gap-4">
                                                                            <div className="w-6 text-zinc-400 text-xs font-bold pt-0.5">{idx + 1}.</div>
                                                                            <div>
                                                                                <div className="font-semibold text-sm text-zinc-900">{m.name}</div>
                                                                                {m.dueDate && (
                                                                                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                                                                        <Calendar className="w-3 h-3" />
                                                                                        {new Date(m.dueDate).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-4 pl-10 md:pl-0">
                                                                            <div className="text-lg font-bold text-zinc-900">{fmtFor(m.amount, activeTabQuotation)}</div>
                                                                            {m.percentage && <div className="text-xs font-bold text-zinc-500">{m.percentage}%</div>}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Action */}
                                                    <div className="flex justify-start pt-6 border-t border-zinc-100">
                                                        <button
                                                            onClick={() => setConfirmApproveId(activeTabQuotation.id)}
                                                            className="w-full md:w-auto px-8 h-12 bg-zinc-900 hover:bg-black text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-md shadow-zinc-900/10"
                                                        >
                                                            <span>Aceptar Opción {activeTabQuotation.optionName}</span>
                                                            <ArrowRight className="w-4 h-4 text-white/70" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Terms and Conditions */}
                        {dealData.proposalTerms && (
                            <div className="mt-16 pt-16 border-t border-zinc-200">
                                <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-zinc-400" />
                                    Términos y Condiciones
                                </h3>
                                <div className="prose prose-sm prose-zinc max-w-none text-zinc-500 leading-relaxed whitespace-pre-wrap">
                                    {dealData.proposalTerms}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <footer className="border-t border-zinc-200 bg-white py-12 text-center mt-10">
                <div className="px-6 flex flex-col items-center gap-4">
                    <p className="text-sm font-medium text-zinc-500">
                        Una propuesta profesional enviada por <strong className="text-black">{isProOrPremium ? workspace?.name : 'Nodally'}</strong>.
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-3 py-1.5 rounded-full border border-zinc-100">
                        Powered by
                        <img src="/NodallyLogo.png" alt="Nodally" className="h-4 object-contain ml-1 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all" />
                    </div>
                </div>
            </footer>

            {/* Confirm Modal */}
            {confirmApproveId && (() => {
                const q = quotations.find((x: any) => x.id === confirmApproveId);
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 animate-in zoom-in-95 duration-200 border border-zinc-200">
                            <div className="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-8 h-8 text-zinc-800" />
                            </div>
                            <h2 className="text-2xl font-bold text-center text-zinc-900 mb-2">Confirmar selección</h2>
                            <p className="text-zinc-500 text-center text-sm mb-6">
                                Estás a punto de confirmar la opción <strong>{q?.optionName}</strong> por un total de
                                <span className="block text-3xl font-bold text-zinc-900 mt-3 mb-2">{q && fmtFor(q.total, q)}</span>
                            </p>
                            <p className="text-center text-xs text-zinc-400 mb-8 leading-relaxed">
                                Al confirmar, notificaremos al equipo para iniciar el proyecto bajo los términos acordados.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleApproveConfirm}
                                    disabled={!!isApproving}
                                    className="w-full h-12 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm shadow-sm"
                                >
                                    {isApproving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar y Aceptar'}
                                </button>
                                <button
                                    onClick={() => setConfirmApproveId(null)}
                                    className="w-full h-12 rounded-xl text-zinc-500 font-semibold hover:bg-zinc-100 hover:text-zinc-800 transition-colors text-sm"
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
