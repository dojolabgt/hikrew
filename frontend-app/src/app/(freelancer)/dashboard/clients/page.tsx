'use client';

import { useState, useEffect } from 'react';
import { clientsApi } from '@/features/clients/api';
import { Client } from '@/features/clients/types';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Mail, Phone, Building2, User, Edit2, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ClientModal } from './_components/ClientModal';
import { toast } from 'sonner';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';
import { DataTable, ColumnDef } from '@/components/common/DataTable';

export default function ClientsPage() {
    const { t } = useWorkspaceSettings();
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const data = await clientsApi.getAll();
            setClients(data);
        } catch (error) {
            console.error('Error loading clients', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) return;
        try {
            await clientsApi.delete(id);
            toast.success(t('common.deleted') || 'Cliente eliminado');
            loadClients();
        } catch {
            toast.error(t('common.error') || 'Error al eliminar el cliente');
        }
    };

    const handleCreate = () => {
        setEditingClient(null);
        setModalOpen(true);
    };

    const columns: ColumnDef<Client>[] = [
        {
            key: 'name',
            header: t('clients.colName'),
            render: (client) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border-2 border-background shadow-sm shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {client.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-semibold group-hover:text-primary transition-colors">
                            {client.name}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                            {client.type === 'company'
                                ? <Building2 className="w-3 h-3 text-muted-foreground" />
                                : <User className="w-3 h-3 text-muted-foreground" />
                            }
                            <span className="text-xs text-muted-foreground capitalize">
                                {client.type === 'company'
                                    ? (t('clientModal.typeCompany') || 'Empresa')
                                    : (t('clientModal.typePerson') || 'Persona')
                                }
                            </span>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'email',
            header: 'Email',
            render: (client) => (
                <div className="flex items-center text-sm text-muted-foreground gap-1.5">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-[200px]">{client.email}</span>
                </div>
            ),
        },
        {
            key: 'phone',
            header: t('clientModal.phoneForm') || 'Teléfono',
            render: (client) => {
                const raw = client.phone || client.whatsapp;
                if (!raw) return <span className="text-muted-foreground text-sm">—</span>;
                // Format: prefix|number → display as "+502 5555-1234"
                const parts = raw.split('|');
                const display = parts.length === 2
                    ? `${parts[0]} ${parts[1]}`
                    : raw;
                return (
                    <div className="flex items-center text-sm text-muted-foreground gap-1.5">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        {display}
                    </div>
                );
            },
        },
        {
            key: 'country',
            header: t('clientModal.countryForm') || 'País',
            render: (client) => (
                <span className="text-sm text-muted-foreground">
                    {client.country || '—'}
                </span>
            ),
        },
        {
            key: 'notes',
            header: t('clients.colNotes'),
            className: 'max-w-[180px]',
            render: (client) => (
                <div className="text-sm text-muted-foreground truncate italic">
                    {client.notes || '—'}
                </div>
            ),
        },
    ];

    return (
        <DashboardShell>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('clients.title')}</h1>
                    <p className="text-muted-foreground">{t('clients.titleDesc')}</p>
                </div>
                <Button
                    type="button"
                    onClick={handleCreate}
                    className="relative z-10 rounded-full px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                    <UserPlus className="mr-2 h-4 w-4" /> {t('clients.create') || 'Nuevo Cliente'}
                </Button>
            </div>

            <DataTable
                data={clients}
                columns={columns}
                isLoading={isLoading}
                emptyIcon={<Users className="w-8 h-8" />}
                emptyTitle={t('clients.emptyTitle')}
                emptyDescription={t('clients.emptyDesc')}
                emptyAction={
                    <Button variant="outline" className="rounded-full" onClick={handleCreate}>
                        {t('clients.emptyBtn')}
                    </Button>
                }
                actions={(client) => [
                    {
                        label: t('common.edit') || 'Editar',
                        icon: <Edit2 className="h-4 w-4" />,
                        onClick: () => handleEdit(client),
                    },
                    {
                        label: t('common.delete') || 'Eliminar',
                        icon: <Trash2 className="h-4 w-4" />,
                        onClick: () => handleDelete(client.id),
                        destructive: true,
                    },
                ]}
            />

            <ClientModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSuccess={loadClients}
                initialData={editingClient}
            />
        </DashboardShell>
    );
}
