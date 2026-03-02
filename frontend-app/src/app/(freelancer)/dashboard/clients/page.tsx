'use client';

import { useState, useEffect } from 'react';
import { clientsApi } from '@/features/clients/api';
import { Client } from '@/features/clients/types';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/button';
import { Plus, Users, UserPlus, Mail, Phone, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ClientModal } from './_components/ClientModal';
import { toast } from 'sonner';

export default function ClientsPage() {
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
            toast.success('Cliente eliminado');
            loadClients();
        } catch (error) {
            toast.error('Error al eliminar el cliente');
        }
    };

    const handleCreate = () => {
        setEditingClient(null);
        setModalOpen(true);
    };

    return (
        <DashboardShell>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground">
                        Gestiona tu cartera de clientes y su información de contacto.
                    </p>
                </div>
                <Button
                    onClick={handleCreate}
                    className="rounded-full px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                    <UserPlus className="mr-2 h-4 w-4" /> Nuevo Cliente
                </Button>
            </div>

            <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-xl" />
                        ))}
                    </div>
                ) : clients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold">No tienes clientes aún</h3>
                        <p className="text-muted-foreground max-w-xs mb-6">
                            Agrega clientes para enviarles cotizaciones y gestionar sus pagos.
                        </p>
                        <Button variant="outline" className="rounded-full" onClick={handleCreate}>
                            Agregar mi primer cliente
                        </Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Contacto</TableHead>
                                <TableHead>Notas</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.map((client) => (
                                <TableRow key={client.id} className="hover:bg-muted/30 transition-colors group h-16">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                    {client.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="font-semibold group-hover:text-primary transition-colors">
                                                {client.name}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center text-sm text-muted-foreground gap-1.5">
                                                <Mail className="w-3 h-3" /> {client.email}
                                            </div>
                                            {client.whatsapp && (
                                                <div className="flex items-center text-sm text-muted-foreground gap-1.5">
                                                    <Phone className="w-3 h-3" /> {client.whatsapp}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px]">
                                        <div className="text-sm text-muted-foreground truncate italic">
                                            {client.notes || '—'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl border-zinc-200 shadow-xl">
                                                <DropdownMenuItem
                                                    onClick={() => handleEdit(client)}
                                                    className="flex items-center cursor-pointer"
                                                >
                                                    <Edit2 className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(client.id)}
                                                    className="flex items-center text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <ClientModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSuccess={loadClients}
                initialData={editingClient}
            />
        </DashboardShell>
    );
}
