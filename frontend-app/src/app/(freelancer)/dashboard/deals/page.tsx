'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowRight, Handshake, Edit2, Trash2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { toast } from 'sonner';

// ─── Status badge helper ─────────────────────────────────────────────────────

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

function StatusBadge({ status }: { status: string }) {
    const key = status?.toUpperCase() ?? 'DRAFT';
    const style = STATUS_STYLES[key] ?? STATUS_STYLES.DRAFT;
    return (
        <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${style}`}>
            {STATUS_LABEL[key] ?? status}
        </span>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DealsPage() {
    const { t } = useWorkspaceSettings();
    const { activeWorkspace } = useAuth();
    const { deals, fetchDeals, createDeal, deleteDeal, isLoading } = useDeals();
    const router = useRouter();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [clientId, setClientId] = useState('');
    const [clients, setClients] = useState<Client[]>([]);

    useEffect(() => {
        if (activeWorkspace) {
            fetchDeals();
            const fetchClients = async () => {
                try {
                    const data = await clientsApi.getAll();
                    setClients(data);
                } catch (e) {
                    console.error('Failed to fetch clients', e);
                }
            };
            fetchClients();
        }
    }, [activeWorkspace, fetchDeals]);

    const handleCreateDeal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId || !title) return;

        const deal = await createDeal({ title, clientId });

        if (deal && deal.id) {
            setIsDialogOpen(false);
            setTitle('');
            setClientId('');
            setTimeout(() => {
                router.push(`/dashboard/deals/${deal.id}`);
            }, 100);
        } else {
            toast.error('Error al crear la propuesta. Revisa la consola.');
        }
    };

    const handleDelete = async (deal: any) => {
        if (!confirm(`¿Eliminar "${deal.name}"? Esta acción no se puede deshacer.`)) return;
        const ok = await deleteDeal(deal.id);
        if (ok) {
            toast.success('Propuesta eliminada');
        } else {
            toast.error('Error al eliminar la propuesta');
        }
    };

    const getClientName = (deal: any) => {
        if (deal.client?.name) return deal.client.name;
        const match = clients.find((c) => c.id === deal.clientId);
        return match?.name ?? '—';
    };

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
                        ID: {deal.id.split('-')[0]}
                    </div>
                </div>
            ),
        },
        {
            key: 'client',
            header: 'Cliente',
            render: (deal) => (
                <span className="text-sm text-muted-foreground">{getClientName(deal)}</span>
            ),
        },
        {
            key: 'status',
            header: 'Estado',
            render: (deal) => <StatusBadge status={deal.status ?? 'draft'} />,
        },
        {
            key: 'createdAt',
            header: 'Creado',
            render: (deal) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(deal.createdAt).toLocaleDateString()}
                </span>
            ),
        },
    ];

    return (
        <DashboardShell>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
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

            <DataTable
                data={deals}
                columns={columns}
                isLoading={isLoading}
                emptyIcon={<Handshake className="w-8 h-8" />}
                emptyTitle="Sin propuestas aún"
                emptyDescription="No has creado ninguna propuesta para tus clientes. Comienza armando una nueva ahora."
                emptyAction={
                    <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setIsDialogOpen(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" /> {t('deals.create')}
                    </Button>
                }
                onRowClick={(deal) => router.push(`/dashboard/deals/${deal.id}`)}
                actions={(deal) => [
                    {
                        label: 'Configurar',
                        icon: <Edit2 className="h-4 w-4" />,
                        onClick: () => router.push(`/dashboard/deals/${deal.id}`),
                    },
                    {
                        label: 'Eliminar',
                        icon: <Trash2 className="h-4 w-4" />,
                        onClick: () => handleDelete(deal),
                        destructive: true,
                    },
                ]}
            />
        </DashboardShell>
    );
}
