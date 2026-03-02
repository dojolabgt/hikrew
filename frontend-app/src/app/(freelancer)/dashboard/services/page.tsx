'use client';

import { useState, useEffect } from 'react';
import { servicesApi } from '@/features/services/api';
import { Service } from '@/features/services/types';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/button';
import { Plus, Package, Edit2, Trash2, MoreHorizontal } from 'lucide-react';
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
import { formatCurrency } from '@/lib/utils';
import { ServiceModal } from './_components/ServiceModal';
import { toast } from 'sonner';

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            const data = await servicesApi.getAll();
            setServices(data);
        } catch (error) {
            console.error('Error loading services', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (service: Service) => {
        setEditingService(service);
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) return;
        try {
            await servicesApi.delete(id);
            toast.success('Servicio eliminado');
            loadServices();
        } catch (error) {
            toast.error('Error al eliminar el servicio');
        }
    };

    const handleCreate = () => {
        setEditingService(null);
        setModalOpen(true);
    };

    return (
        <DashboardShell>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Servicios</h1>
                    <p className="text-muted-foreground">
                        Gestiona el catálogo de servicios que ofreces a tus clientes.
                    </p>
                </div>
                <Button
                    onClick={handleCreate}
                    className="rounded-full px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
                </Button>
            </div>

            <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-lg" />
                        ))}
                    </div>
                ) : services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Package className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold">No tienes servicios aún</h3>
                        <p className="text-muted-foreground max-w-xs mb-6">
                            Comienza agregando los servicios que quieres cobrar en tus cotizaciones.
                        </p>
                        <Button variant="outline" className="rounded-full" onClick={handleCreate}>
                            Agregar mi primer servicio
                        </Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead className="text-right">Precio Base</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.map((service) => (
                                <TableRow key={service.id} className="hover:bg-muted/30 transition-colors group">
                                    <TableCell>
                                        <div className="font-medium group-hover:text-primary transition-colors">
                                            {service.name}
                                        </div>
                                        {service.description && (
                                            <div className="text-xs text-muted-foreground truncate max-w-xs">
                                                {service.description}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                                            {service.category || 'General'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {formatCurrency(service.defaultPrice, service.currency)}
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
                                                    onClick={() => handleEdit(service)}
                                                    className="flex items-center cursor-pointer"
                                                >
                                                    <Edit2 className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(service.id)}
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

            <ServiceModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSuccess={loadServices}
                initialData={editingService}
            />
        </DashboardShell>
    );
}
