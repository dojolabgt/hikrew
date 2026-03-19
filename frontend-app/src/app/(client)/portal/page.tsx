'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { portalApi, PortalDeal } from '@/features/portal/api';
import { getImageUrl, cn } from '@/lib/utils';
import {
    FileText, Clock, CheckCircle2, ArrowRight, Loader2,
    CreditCard, Inbox, AlertCircle, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import api from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type DealStage = 'brief' | 'waiting' | 'proposal' | 'approved';

function resolveDealStage(deal: PortalDeal): DealStage {
    const briefDone = deal.brief?.isCompleted ?? true;
    const briefExists = !!deal.brief;
    const hasQuotations = (deal.quotations?.length ?? 0) > 0;
    const isApproved = deal.quotations?.some((q) => q.isApproved) ?? false;

    if (briefExists && !briefDone) return 'brief';
    if (!hasQuotations) return 'waiting';
    if (isApproved) return 'approved';
    return 'proposal';
}

const STAGE_META: Record<DealStage, {
    label: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    description: string;
}> = {
    brief: {
        label: 'Brief pendiente',
        icon: <FileText className="h-3.5 w-3.5" />,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
        description: 'Completa el cuestionario para continuar.',
    },
    waiting: {
        label: 'En preparación',
        icon: <Clock className="h-3.5 w-3.5" />,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        description: 'Tu propuesta está siendo preparada.',
    },
    proposal: {
        label: 'Propuesta lista',
        icon: <FileText className="h-3.5 w-3.5" />,
        color: 'text-violet-600 dark:text-violet-400',
        bg: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
        description: 'Revisa y aprueba la cotización.',
    },
    approved: {
        label: 'Aprobado',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        description: 'Propuesta aceptada.',
    },
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

function PaymentProgress({ deal }: { deal: PortalDeal }) {
    const milestones = deal.paymentPlan?.milestones ?? [];
    if (milestones.length === 0) return null;

    const paid = milestones.filter((m) => m.status === 'PAID').length;
    const total = milestones.length;
    const pct = Math.round((paid / total) * 100);

    return (
        <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                    <CreditCard className="h-3 w-3" />
                    Plan de cobro
                </span>
                <span className="font-medium">{paid}/{total} pagados</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                <div
                    className="h-full rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

// ─── Deal card ────────────────────────────────────────────────────────────────

function DealCard({ deal }: { deal: PortalDeal }) {
    const stage = resolveDealStage(deal);
    const meta = STAGE_META[stage];
    const logo = deal.workspace.logo ? getImageUrl(deal.workspace.logo) : null;
    const workspaceName = deal.workspace.businessName || 'Freelancer';

    return (
        <Link
            href={`/d/${deal.publicToken}`}
            className="group block bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
        >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-4">
                {/* Workspace info */}
                <div className="flex items-center gap-3 min-w-0">
                    {logo ? (
                        <Image
                            src={logo}
                            alt={workspaceName}
                            width={36}
                            height={36}
                            className="rounded-lg object-contain shrink-0 border border-zinc-100 dark:border-zinc-800"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4 text-zinc-400" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-xs text-zinc-400 truncate">De:</p>
                        <p className="text-sm font-semibold truncate">{workspaceName}</p>
                    </div>
                </div>

                {/* Stage badge */}
                <span className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0',
                    meta.color, meta.bg
                )}>
                    {meta.icon}
                    {meta.label}
                </span>
            </div>

            {/* Description */}
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{meta.description}</p>

            {/* Payment progress */}
            <PaymentProgress deal={deal} />

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-xs text-zinc-400">{formatDate(deal.createdAt)}</span>
                <span className="flex items-center gap-1 text-xs font-medium text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                    Ver propuesta <ArrowRight className="h-3.5 w-3.5" />
                </span>
            </div>
        </Link>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortalPage() {
    const { user, checkAuth, switchWorkspace } = useAuth();
    const router = useRouter();
    const [deals, setDeals] = useState<PortalDeal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        portalApi.getDeals()
            .then(setDeals)
            .catch(() => setError('No se pudo cargar tus propuestas. Inténtalo de nuevo.'))
            .finally(() => setIsLoading(false));
    }, []);

    const handleCreateWorkspace = async () => {
        setIsCreatingWorkspace(true);
        try {
            const res = await api.post<{ id: string }>('/workspaces/create');
            await checkAuth();
            switchWorkspace(res.data.id);
            router.push('/onboarding');
        } catch {
            setError('No se pudo crear el espacio de trabajo. Inténtalo de nuevo.');
            setIsCreatingWorkspace(false);
        }
    };

    const firstName = user?.firstName || user?.email?.split('@')[0] || 'cliente';
    const hasOwnerWorkspace = user?.workspaceMembers?.some(
        (wm) => wm.role === 'owner' || wm.role === 'collaborator',
    );

    const activeDeals = deals.filter((d) => resolveDealStage(d) !== 'approved');
    const approvedDeals = deals.filter((d) => resolveDealStage(d) === 'approved');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Greeting */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Hola, {firstName} 👋
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Aquí puedes revisar y gestionar todas tus propuestas.
                </p>
            </div>

            {/* Upgrade to freelancer banner — only for pure clients */}
            {!hasOwnerWorkspace && (
                <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="min-w-0">
                        <p className="text-sm font-medium">¿Quieres ofrecer tus servicios?</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Crea tu propio espacio de trabajo y gestiona clientes y proyectos.
                        </p>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 rounded-full gap-1.5"
                        onClick={handleCreateWorkspace}
                        disabled={isCreatingWorkspace}
                    >
                        {isCreatingWorkspace
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Plus className="h-3.5 w-3.5" />
                        }
                        Crear espacio
                    </Button>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/[0.07] border border-red-500/[0.15]">
                    <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {/* Empty */}
            {!error && deals.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Inbox className="h-7 w-7 text-zinc-400" />
                    </div>
                    <h2 className="text-base font-semibold">Sin propuestas todavía</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
                        Cuando tu freelancer te envíe una propuesta aparecerá aquí.
                    </p>
                </div>
            )}

            {/* Active deals */}
            {activeDeals.length > 0 && (
                <div className="space-y-3">
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Propuestas activas — {activeDeals.length}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {activeDeals.map((deal) => (
                            <DealCard key={deal.id} deal={deal} />
                        ))}
                    </div>
                </div>
            )}

            {/* Approved deals */}
            {approvedDeals.length > 0 && (
                <div className="space-y-3 pt-2">
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Historial aprobado — {approvedDeals.length}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {approvedDeals.map((deal) => (
                            <DealCard key={deal.id} deal={deal} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
