'use client';

import { useState, useEffect, useCallback } from 'react';
import { clientsApi } from '@/features/clients/api';
import { Client, ClientType } from '@/features/clients/types';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/button';
import {
    Users, UserPlus, Mail, Phone, Building2, User,
    Edit2, Trash2, Send, MapPin,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ClientModal } from './_components/ClientModal';
import { InvitePortalDialog } from './_components/InvitePortalDialog';
import { toast } from 'sonner';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';
import { useListState } from '@/hooks/use-list-state';
import { AppSearch } from '@/components/common/AppSearch';
import { AppFilterTabs, FilterOption } from '@/components/common/AppFilterTabs';
import { AppPagination } from '@/components/common/AppPagination';
import { cn } from '@/lib/utils';

const TYPE_OPTIONS: FilterOption<ClientType>[] = [
    { label: 'Todos', value: undefined },
    { label: 'Persona', value: 'person' },
    { label: 'Empresa', value: 'company' },
];

const AVATAR_COLORS = [
    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
];

function getAvatarColor(name: string) {
    const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
}

function formatPhone(raw?: string) {
    if (!raw) return null;
    const parts = raw.split('|');
    return parts.length === 2 ? `${parts[0]} ${parts[1]}` : raw;
}

// ─── Client Card ──────────────────────────────────────────────────────────────

function ClientCard({
    client,
    onEdit,
    onInvite,
    onDelete,
    t,
}: {
    client: Client;
    onEdit: (c: Client) => void;
    onInvite: (c: Client) => void;
    onDelete: (id: string) => void;
    t: (k: string) => string;
}) {
    const initials = client.name.substring(0, 2).toUpperCase();
    const phone = formatPhone(client.phone || client.whatsapp);
    const avatarColor = getAvatarColor(client.name);

    return (
        <div className="group relative flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all duration-200">

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 rounded-xl shrink-0 shadow-sm">
                        <AvatarFallback className={cn('rounded-xl text-sm font-bold', avatarColor)}>
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm text-zinc-900 dark:text-white truncate leading-tight">
                            {client.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {client.type === 'company'
                                ? <Building2 className="w-3 h-3 text-zinc-400 shrink-0" />
                                : <User className="w-3 h-3 text-zinc-400 shrink-0" />
                            }
                            <span className="text-[11px] text-zinc-400">
                                {client.type === 'company'
                                    ? t('clientModal.typeCompany')
                                    : t('clientModal.typePerson')}
                            </span>
                            {client.country && (
                                <>
                                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                                    <MapPin className="w-3 h-3 text-zinc-300 dark:text-zinc-600 shrink-0" />
                                    <span className="text-[11px] text-zinc-400">{client.country}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Hover actions */}
                <div className="flex items-center gap-0.5 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(client)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title={t('common.edit')}
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onDelete(client.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title={t('common.delete')}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Contact info */}
            <div className="space-y-1.5 flex-1">
                {client.email && (
                    <a
                        href={`mailto:${client.email}`}
                        className="flex items-center gap-2 text-[12px] text-zinc-500 dark:text-zinc-400 hover:text-primary transition-colors group/link"
                    >
                        <Mail className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                        <span className="truncate">{client.email}</span>
                    </a>
                )}
                {phone && (
                    <div className="flex items-center gap-2 text-[12px] text-zinc-500 dark:text-zinc-400">
                        <Phone className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                        <span>{phone}</span>
                    </div>
                )}
                {client.notes && (
                    <p className="text-[11px] text-zinc-400 italic truncate mt-1">{client.notes}</p>
                )}
            </div>

            {/* Portal status footer */}
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                {client.linkedUserId ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        {t('clients.portalActive')}
                    </span>
                ) : (
                    <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0" />
                        {t('clients.noPortal')}
                    </span>
                )}
                {!client.linkedUserId && (
                    <button
                        onClick={() => onInvite(client)}
                        className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline transition-colors"
                    >
                        <Send className="w-3 h-3" />
                        {t('clients.invitePortal')}
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
    return (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4" />
                    <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
                </div>
            </div>
            <div className="space-y-2 mb-4">
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-2/3" />
            </div>
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/3" />
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
    const { t } = useWorkspaceSettings();

    const list = useListState<{ type: ClientType | undefined }>({
        initialFilters: { type: undefined },
    });

    const [clients, setClients] = useState<Client[]>([]);
    const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [inviteClient, setInviteClient] = useState<Client | null>(null);

    const loadClients = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await clientsApi.getAll(list.query);
            setClients(res.data);
            setMeta({ total: res.total, totalPages: res.totalPages });
        } catch {
            // silent
        } finally {
            setIsLoading(false);
        }
    }, [list.query]);

    useEffect(() => { loadClients(); }, [loadClients]);

    const handleEdit = (client: Client) => { setEditingClient(client); setModalOpen(true); };
    const handleCreate = () => { setEditingClient(null); setModalOpen(true); };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) return;
        try {
            await clientsApi.delete(id);
            toast.success(t('common.deleted'));
            loadClients();
        } catch {
            toast.error(t('common.error'));
        }
    };

    const handleInvite = (client: Client) => {
        if (client.linkedUserId) {
            toast.info(t('clients.alreadyLinked'));
            return;
        }
        setInviteClient(client);
    };

    return (
        <DashboardShell>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('clients.title')}</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">{t('clients.titleDesc')}</p>
                </div>
                <Button
                    onClick={handleCreate}
                    className="rounded-full px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t('clients.create')}
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                <AppSearch
                    value={list.search}
                    onChange={list.setSearch}
                    placeholder={t('clients.searchPlaceholder')}
                    className="w-64"
                />
                <AppFilterTabs
                    options={TYPE_OPTIONS}
                    value={list.filters.type}
                    onChange={(v) => list.setFilter('type', v)}
                />
                {!isLoading && (
                    <span className="ml-auto text-[12px] text-zinc-400">
                        {meta.total} {meta.total === 1 ? 'cliente' : 'clientes'}
                    </span>
                )}
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
            ) : clients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                        <Users className="w-7 h-7 text-zinc-400" />
                    </div>
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{t('clients.emptyTitle')}</p>
                    <p className="text-sm text-zinc-400 mb-5 max-w-xs">{t('clients.emptyDesc')}</p>
                    <Button variant="outline" className="rounded-full" onClick={handleCreate}>
                        {t('clients.emptyBtn')}
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clients.map((client) => (
                        <ClientCard
                            key={client.id}
                            client={client}
                            onEdit={handleEdit}
                            onInvite={handleInvite}
                            onDelete={handleDelete}
                            t={t}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div className="mt-6">
                    <AppPagination
                        page={list.page}
                        totalPages={meta.totalPages}
                        total={meta.total}
                        limit={20}
                        onPageChange={list.setPage}
                    />
                </div>
            )}

            <ClientModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSuccess={loadClients}
                initialData={editingClient ?? undefined}
            />
            <InvitePortalDialog
                client={inviteClient}
                open={!!inviteClient}
                onOpenChange={(open) => !open && setInviteClient(null)}
            />
        </DashboardShell>
    );
}
