'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { clientsApi } from '@/features/clients/api';
import { toast } from 'sonner';

const clientSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Córreo electrónico inválido'),
    whatsapp: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export function ClientModal({ open, onOpenChange, onSuccess, initialData }: ClientModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: '',
            email: '',
            whatsapp: '',
            notes: '',
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                email: initialData.email,
                whatsapp: initialData.whatsapp || '',
                notes: initialData.notes || '',
            });
        } else {
            form.reset({
                name: '',
                email: '',
                whatsapp: '',
                notes: '',
            });
        }
    }, [initialData, form, open]);

    const onSubmit = async (values: ClientFormValues) => {
        setIsSubmitting(true);
        try {
            if (initialData?.id) {
                await clientsApi.update(initialData.id, values as any);
                toast.success('Cliente actualizado correctamente');
            } else {
                await clientsApi.create(values as any);
                toast.success('Cliente creado correctamente');
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al guardar el cliente';
            toast.error(message);
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                    <DialogDescription>
                        Completa la información básica para gestionar tus contactos.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre Completo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Juan Pérez" {...field} value={field.value || ''} className="rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Correo Electrónico</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="cliente@ejemplo.com" {...field} value={field.value || ''} className="rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="whatsapp"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>WhatsApp (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+502 0000 0000" {...field} value={field.value || ''} className="rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas / Detalles</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Cualquier nota interna sobre este cliente..."
                                            {...field}
                                            value={field.value || ''}
                                            className="rounded-xl resize-none h-24"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-full shadow-lg shadow-primary/20"
                            >
                                {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar' : 'Crear Cliente')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
