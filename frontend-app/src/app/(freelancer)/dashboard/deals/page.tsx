'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowRight, Handshake, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';
import { useDeals } from '@/hooks/use-deals';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { clientsApi } from '@/features/clients/api';
import { Client } from '@/features/clients/types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { toast } from 'sonner';

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
    DRAFT: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
    SENT: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
    VIEWED: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
    NEGOTIATING: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400',
    WON: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400',
    LOST: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400',
};

const STATUS_LABEL: Record<string, string> = {
    DRAFT: 'Borrador',
    SENT: 'Enviado',
    VIEWED: 'Visto',
    NEGOTIATING: 'En negociación',
    WON: 'Ganado',
    LOST: 'Perdido',
};

const ALL_STATUSES = ['DRAFT', 'SENT', 'VIEWED', 'NEGOTIATING', 'WON', 'LOST'];

function StatusBadge({ status }: { status: string }) {
    const key = status?.toUpperCase() ?? 'DRAFT';
    return (
        <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${STATUS_STYLES[key] ?? STATUS_STYLES.DRAFT}`}>
            {STATUS_LABEL[key] ?? status}
        </span>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DealsPage() {
    const { t } = useWorkspaceSettings();
    const { activeWorkspace } = useAuth();
    const { deals, fetchDeals, createDeal, deleteDeal, isLoading } = useDeals();
    const router = useRouter();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [clientId, setClientId] = useState('');
    const [clients, setClients] = useState<Client[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [dealToDelete, setDealToDelete] = useState<any | null>(null);

    useEffect(() => {
        if (activeWorkspace) {
            fetchDeals();
            clientsApi.getAll().then(setClients).catch(console.error);
        }
    }, [activeWorkspace, fetchDeals]);

    const handleCreateDeal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId || !title) return;
        const deal = await createDeal({ title, clientId });
        if (deal?.id) {
            setIsDialogOpen(false);
            setTitle('');
            setClientId('');
            router.push(`/dashboard/deals/${deal.id}`);
        } else {
            toast.error('Error al crear la propuesta.');
        }
    };

    const handleConfirmDelete = async () => {
        if (!dealToDelete) return;
        const ok = await deleteDeal(dealToDelete.id);
        if (ok) toast.success('Propuesta eliminada');
        else toast.error('Error al eliminar la propuesta');
        setDealToDelete(null);
    };

    const getClientName = (deal: any) => deal.client?.name ?? '—';

    const getDealTotal = (deal: any) => {
        const approved = deal.quotations?.find((q: any) => q.isApproved);
        const any = deal.quotations?.[0];
        const total = approved?.total ?? any?.total ?? null;
        if (total === null) return null;
        return Number(total);
    };

    // Filter by status
    const filteredDeals = statusFilter === 'ALL'
        ? deals
        : deals.filter(d => d.status?.toUpperCase() === statusFilter);

    const columns: ColumnDef<any>[] = [
        {
            key: 'name',
            header: 'Propuesta',
            render: (deal) => (
                <div>
                    <div className="font-semibold group-hover:text-primary transition-colors">
                        {deal.name || '(sin nombre)'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {getClientName(deal)}
                    </div>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Estado',
            render: (deal) => <StatusBadge status={deal.status ?? 'DRAFT'} />,
        },
        {
            key: 'total',
            header: 'Total',
            render: (deal) => {
                const total = getDealTotal(deal);
                return (
                    <span className={total !== null ? 'text-sm font-semibold text-emerald-600 dark:text-emerald-400' : 'text-sm text-zinc-400'}>
                        {total !== null
                            ? `$${total.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`
                            : '—'
                        }
                    </span>
                );
            },
        },
        {
            key: 'createdAt',
            header: 'Creado',
            render: (deal) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(deal.createdAt).toLocaleDateString('es-GT')}
                </span>
            ),
        },
    ];

    return (
        <DashboardShell>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('deals.title')}</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona tus propuestas comerciales, cotizaciones y planes de pago.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="relative z-10 rounded-full px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" /> {t('deals.create')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear nueva Propuesta</DialogTitle>
                            <DialogDescription>
                                Nombra este trato (ej. "Rediseño Web V2") y asígnale el cliente.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateDeal} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Nombre de la Propuesta</Label>
                                <Input
                                    id="title"
                                    placeholder="Ej. Campaña 360..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="client">Cliente</Label>
                                <Select value={clientId || undefined} onValueChange={setClientId} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem key={client.id} value={client.id}>
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                        {clients.length === 0 && (
                                            <SelectItem value="temp_empty" disabled>
                                                No tienes clientes aún
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isLoading || !title || !clientId}>
                                    {isLoading ? 'Creando...' : 'Comenzar Flujo'}{' '}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Status filter tabs */}
            <div className="flex items-center gap-1.5 mb-5 flex-wrap">
                {['ALL', ...ALL_STATUSES].map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${statusFilter === s
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-primary/50'
                            }`}
                    >
                        {s === 'ALL' ? 'Todos' : STATUS_LABEL[s]}
                        {s !== 'ALL' && (
                            <span className="ml-1.5 opacity-60 text-[10px]">
                                {deals.filter(d => d.status?.toUpperCase() === s).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <DataTable
                data={filteredDeals}
                columns={columns}
                isLoading={isLoading}
                emptyIcon={<Handshake className="w-8 h-8" />}
                emptyTitle="Sin propuestas aún"
                emptyDescription="No has creado ninguna propuesta para tus clientes. Comienza armando una nueva ahora."
                emptyAction={
                    <Button variant="outline" className="rounded-full" onClick={() => setIsDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> {t('deals.create')}
                    </Button>
                }
                onRowClick={(deal) => router.push(`/dashboard/deals/${deal.id}`)}
                actions={(deal) => [
                    {
                        label: 'Eliminar',
                        icon: <Trash2 className="h-4 w-4" />,
                        onClick: () => setDealToDelete(deal),
                        destructive: true,
                    },
                ]}
            />

            {/* Delete confirmation (proper AlertDialog, not native confirm()) */}
            <AlertDialog open={!!dealToDelete} onOpenChange={(o) => !o && setDealToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar esta propuesta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará <strong>"{dealToDelete?.name}"</strong> junto con su brief, cotizaciones y plan de pagos. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-rose-600 hover:bg-rose-700"
                            onClick={handleConfirmDelete}
                        >
                            Eliminar propuesta
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardShell>
    );
}
