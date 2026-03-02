'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { billingApi } from '@/features/billing/api';
import { BillingStatus, BillingSubscription } from '@/features/billing/types';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Sparkles, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    active: { label: 'Activo', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    past_due: { label: 'Pago vencido', color: 'text-red-600 bg-red-50 border-red-200' },
    cancelled: { label: 'Cancelado', color: 'text-zinc-500 bg-zinc-50 border-zinc-200' },
    unable_to_start: { label: 'No iniciado', color: 'text-red-600 bg-red-50 border-red-200' },
};

function formatPrice(cents: number): string {
    return `Q${(cents / 100).toFixed(2).replace(/\.00$/, '')}`;
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return format(new Date(dateStr), "d 'de' MMMM, yyyy", { locale: es });
}

export default function BillingPage() {
    const [status, setStatus] = useState<BillingStatus | null>(null);
    const [history, setHistory] = useState<BillingSubscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isYearly, setIsYearly] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        async function load() {
            try {
                const [s, h] = await Promise.all([
                    billingApi.getStatus(),
                    billingApi.getHistory(),
                ]);
                setStatus(s);
                setHistory(h);
            } catch {
                toast.error('Error cargando información de facturación');
            } finally {
                setIsLoading(false);
            }
        }
        load();

        // Show toast based on return from Recurrente checkout
        if (searchParams?.get('success')) {
            toast.success('¡Suscripción activada! Tu plan Pro está listo.');
        } else if (searchParams?.get('cancelled')) {
            toast.info('Pago cancelado. Puedes intentarlo de nuevo cuando quieras.');
        }
    }, [searchParams]);

    const handleSubscribe = async (plan: 'pro' | 'premium', interval: 'month' | 'year') => {
        setIsSubscribing(true);
        try {
            const { checkoutUrl } = await billingApi.subscribe(plan, interval);
            window.location.href = checkoutUrl;
        } catch {
            toast.error('No se pudo iniciar el proceso de pago');
            setIsSubscribing(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm('¿Estás seguro? Tu acceso Pro terminará al final del período actual.')) return;
        setIsCancelling(true);
        try {
            await billingApi.cancel();
            toast.success('Suscripción cancelada');
            const updated = await billingApi.getStatus();
            setStatus(updated);
            const newHistory = await billingApi.getHistory();
            setHistory(newHistory);
        } catch {
            toast.error('Error al cancelar la suscripción');
        } finally {
            setIsCancelling(false);
        }
    };

    const planKey = status?.plan || 'free';
    const isProOrPremium = planKey === 'pro' || planKey === 'premium';

    return (
        <DashboardShell>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight">Facturación y Planes</h1>
                <p className="text-muted-foreground mt-1">
                    Administra tu suscripción a Blend y tu historial de pagos.
                </p>
            </div>

            <div className="space-y-8">

                {/* --- 1. CURRENT PLAN CARD --- */}
                <div className="rounded-2xl border bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-900/50 overflow-hidden shadow-sm relative">
                    {/* Decorative Background Icon */}
                    <div className="absolute -top-10 -right-10 opacity-[0.03] dark:opacity-[0.02] pointer-events-none">
                        <Sparkles className="w-64 h-64" />
                    </div>
                    <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        {isLoading ? (
                            <div className="space-y-3 w-full">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-8 w-40" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                        ) : (
                            <>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-primary/40 block"></span>
                                        Plan actual
                                    </p>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-3xl font-extrabold tracking-tight capitalize text-zinc-900 dark:text-zinc-100">
                                            Blend {planKey}
                                        </span>
                                        {planKey === 'premium' ? (
                                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 py-1 px-3 shadow-sm rounded-full">
                                                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Premium
                                            </Badge>
                                        ) : planKey === 'pro' ? (
                                            <Badge className="bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20 py-1 px-3 shadow-sm rounded-full">
                                                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Pro
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 py-1 px-3 shadow-sm rounded-full">
                                                Free
                                            </Badge>
                                        )}
                                    </div>

                                    {isProOrPremium && status?.planExpiresAt ? (
                                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mt-3">
                                            <Clock className="w-4 h-4 opacity-70" />
                                            Tu ciclo actual termina el <span className="text-foreground">{formatDate(status.planExpiresAt)}</span>
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground mt-2 max-w-lg leading-relaxed">
                                            Estás en el plan gratuito. Tienes límites en cotizaciones y clientes. Mejora tu plan para automatizar tu negocio financiero.
                                        </p>
                                    )}
                                </div>

                                {isProOrPremium && (
                                    <div className="flex-shrink-0">
                                        <Button
                                            variant="outline"
                                            onClick={handleCancel}
                                            disabled={isCancelling}
                                            className="w-full md:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/30 transition-colors"
                                        >
                                            {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Cancelar suscripción
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* --- 2. UPGRADE PLANS SECTION --- */}
                {!isLoading && !isProOrPremium && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">Elige tu plan</h2>
                                <p className="text-sm text-muted-foreground mt-1">Desbloquea todo el potencial de Blend para tu negocio.</p>
                            </div>

                            {/* Toggle Mensual/Anual */}
                            <div className="flex items-center bg-zinc-100/80 dark:bg-zinc-800/50 p-1 rounded-full border shadow-inner self-start md:self-end">
                                <button
                                    onClick={() => setIsYearly(false)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${!isYearly ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-muted-foreground hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                >
                                    Mensual
                                </button>
                                <button
                                    onClick={() => setIsYearly(true)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${isYearly ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-muted-foreground hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                >
                                    Anual
                                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                                        -16%
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {/* FREE PLAN */}
                            <div className="rounded-2xl border bg-white dark:bg-zinc-900/60 overflow-hidden shadow-sm flex flex-col relative transition-all duration-300 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-1">
                                <div className="p-6 md:p-8 flex flex-col flex-grow">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Free</h3>
                                        <p className="text-sm text-muted-foreground min-h-[40px] leading-relaxed">
                                            Para empezar a usar Blend y probar la plataforma.
                                        </p>
                                    </div>

                                    <div className="mb-6 space-y-1">
                                        <div className="flex items-end gap-1">
                                            <span className="text-4xl font-extrabold tracking-tight text-foreground">
                                                $0
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground h-5 mt-1">
                                            Gratis para siempre
                                        </p>
                                    </div>

                                    <ul className="space-y-4 mb-8 flex-grow">
                                        {[
                                            'Hasta 5 clientes',
                                            'Hasta 5 cotizaciones/mes',
                                            'Soporte comunitario',
                                        ].map((feat) => (
                                            <li key={feat} className="flex items-start gap-3 text-sm text-muted-foreground">
                                                <CheckCircle2 className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                                                <span className="pt-0.5">{feat}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-auto">
                                        <Button
                                            variant="outline"
                                            className="w-full h-11 text-zinc-700 bg-zinc-50 border-zinc-200 hover:bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800/50 dark:border-zinc-800 dark:hover:bg-zinc-800 rounded-xl"
                                            disabled={true}
                                        >
                                            Tu plan actual
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* PRO PLAN */}
                            <div className="rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-gradient-to-b from-white to-violet-50/30 dark:from-zinc-900 dark:to-violet-950/20 overflow-hidden shadow-md flex flex-col relative transition-all duration-300 hover:shadow-xl hover:border-violet-400 dark:hover:border-violet-500/60 hover:-translate-y-1 group">
                                {/* Subtle animated glow on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full ease-linear"></div>

                                <div className="p-6 md:p-8 flex flex-col flex-grow relative z-10">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold text-violet-600 dark:text-violet-400 mb-2">Pro</h3>
                                        <p className="text-sm text-muted-foreground min-h-[40px] leading-relaxed">
                                            Ideal para freelancers buscando automatizar cobros de forma profesional.
                                        </p>
                                    </div>

                                    <div className="mb-6 space-y-1">
                                        {status?.prices ? (
                                            <>
                                                <div className="flex items-end gap-1">
                                                    <span className="text-4xl font-extrabold tracking-tight text-foreground">
                                                        {isYearly ? formatPrice(status.prices.yearly / 12) : formatPrice(status.prices.monthly)}
                                                    </span>
                                                    <span className="text-sm font-medium text-muted-foreground mb-1.5">/ mes</span>
                                                </div>
                                                <p className="text-sm font-medium text-violet-600/80 dark:text-violet-400/80 h-5 mt-1">
                                                    {isYearly ? `Facturado anualmente (${formatPrice(status.prices.yearly)})` : 'Facturado mes a mes'}
                                                </p>
                                            </>
                                        ) : (
                                            <Skeleton className="h-10 w-32" />
                                        )}
                                    </div>

                                    <ul className="space-y-4 mb-8 flex-grow">
                                        {[
                                            'Clientes ilimitados',
                                            'Cotizaciones ilimitadas',
                                            'Pagos automatizados',
                                            'Recordatorios de pago',
                                        ].map((feat) => (
                                            <li key={feat} className="flex items-start gap-3 text-sm text-muted-foreground">
                                                <CheckCircle2 className="w-5 h-5 text-violet-500 flex-shrink-0" />
                                                <span className="pt-0.5">{feat}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-auto">
                                        <Button
                                            className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl shadow-sm transition-all active:scale-[0.98]"
                                            onClick={() => handleSubscribe('pro', isYearly ? 'year' : 'month')}
                                            disabled={isSubscribing}
                                        >
                                            {isSubscribing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Upgrade a Pro
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* PREMIUM PLAN */}
                            <div className="rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-gradient-to-br from-white via-amber-50/50 to-amber-100/50 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/20 overflow-hidden shadow-lg flex flex-col relative transition-all duration-300 hover:shadow-xl hover:border-amber-400 dark:hover:border-amber-500/70 hover:-translate-y-1 ring-1 ring-amber-500/20 dark:ring-amber-500/10">
                                {/* Badge overlay */}
                                <div className="absolute top-0 inset-x-0 bg-amber-400/20 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-bold uppercase tracking-widest py-1.5 text-center border-b border-amber-200 dark:border-amber-500/20 backdrop-blur-sm">
                                    Mejor Valor
                                </div>

                                <div className="p-6 md:p-8 pt-10 flex flex-col flex-grow relative z-10">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                                            Premium <Sparkles className="w-5 h-5" />
                                        </h3>
                                        <p className="text-sm text-muted-foreground min-h-[40px] leading-relaxed">
                                            Para equipos o agencias. Todo ilimitado y experiencia personalizada.
                                        </p>
                                    </div>

                                    <div className="mb-6 space-y-1">
                                        {status?.prices ? (
                                            <>
                                                <div className="flex items-end gap-1">
                                                    <span className="text-4xl font-extrabold tracking-tight text-foreground">
                                                        {isYearly ? formatPrice(status.prices.yearly / 12) : formatPrice(status.prices.monthly)}
                                                    </span>
                                                    <span className="text-sm font-medium text-muted-foreground mb-1.5">/ mes</span>
                                                </div>
                                                <p className="text-sm font-medium text-amber-600/80 dark:text-amber-400/80 h-5 mt-1">
                                                    {isYearly ? `Facturado anualmente (${formatPrice(status.prices.yearly)})` : 'Facturado mes a mes'}
                                                </p>
                                            </>
                                        ) : (
                                            <Skeleton className="h-10 w-32" />
                                        )}
                                    </div>

                                    <ul className="space-y-4 mb-8 flex-grow">
                                        {[
                                            'Todo en el plan Pro',
                                            'Múltiples usuarios',
                                            'Soporte directo por WhatsApp',
                                            'Checkouts con tu logo',
                                        ].map((feat, i) => (
                                            <li key={feat} className={`flex items-start gap-3 text-sm ${i === 0 ? 'font-semibold text-foreground mb-2' : 'text-muted-foreground'}`}>
                                                <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${i === 0 ? 'text-amber-500' : 'text-amber-400/80'}`} />
                                                <span className="pt-0.5">{feat}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-auto">
                                        <Button
                                            className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl shadow-sm transition-all active:scale-[0.98]"
                                            onClick={() => handleSubscribe('premium', isYearly ? 'year' : 'month')}
                                            disabled={isSubscribing}
                                        >
                                            {isSubscribing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Upgrade a Premium
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* --- 3. BILLING HISTORY --- */}
                {history.length > 0 && (
                    <div className="rounded-xl border bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                        <div className="p-6 pb-4 border-b">
                            <h3 className="text-lg font-semibold tracking-tight">Historial de pagos</h3>
                        </div>
                        <div className="divide-y divide-border">
                            {history.map((sub) => {
                                const st = STATUS_LABEL[sub.status] ?? { label: sub.status, color: '' };
                                return (
                                    <div key={sub.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold capitalize flex items-center gap-2">
                                                Blend {(sub as any).plan || 'Pro'}
                                                <span className="text-muted-foreground font-normal text-xs uppercase tracking-wider">
                                                    ({sub.interval === 'month' ? 'Mensual' : 'Anual'})
                                                </span>
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {formatDate(sub.createdAt)}
                                            </p>
                                        </div>
                                        <Badge className={`text-xs px-2.5 py-1 border ${st.color}`}>
                                            {sub.status === 'active' && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                                            {sub.status === 'cancelled' && <XCircle className="w-3.5 h-3.5 mr-1" />}
                                            {st.label}
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="space-y-4 pt-4">
                        <Skeleton className="h-48 w-full rounded-xl" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
