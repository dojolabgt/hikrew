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
    DialogFooter
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ServiceCurrency } from '@/features/services/types';
import { servicesApi } from '@/features/services/api';
import { toast } from 'sonner';

const serviceSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    description: z.string().optional().nullable(),
    defaultPrice: z.coerce.number().min(0, 'El precio no puede ser negativo'),
    currency: z.nativeEnum(ServiceCurrency),
    category: z.string().optional().nullable(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export function ServiceModal({ open, onOpenChange, onSuccess, initialData }: ServiceModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: '',
            description: '',
            defaultPrice: 0,
            currency: ServiceCurrency.GTQ,
            category: '',
        },
    });

    // Update form values when initialData changes
    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                description: initialData.description || '',
                defaultPrice: Number(initialData.defaultPrice),
                currency: initialData.currency,
                category: initialData.category || '',
            });
        } else {
            form.reset({
                name: '',
                description: '',
                defaultPrice: 0,
                currency: ServiceCurrency.GTQ,
                category: '',
            });
        }
    }, [initialData, form, open]);

    const onSubmit = async (values: ServiceFormValues) => {
        setIsSubmitting(true);
        try {
            if (initialData?.id) {
                await servicesApi.update(initialData.id, values as any);
                toast.success('Servicio actualizado correctamente');
            } else {
                await servicesApi.create(values as any);
                toast.success('Servicio creado correctamente');
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error('Error al guardar el servicio');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Servicio</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Diseño de Logotipo" {...field} value={field.value || ''} className="rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="defaultPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio Base</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} className="rounded-xl" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="currency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Moneda</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="GTQ" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value={ServiceCurrency.GTQ}>GTQ (Q)</SelectItem>
                                                <SelectItem value={ServiceCurrency.USD}>USD ($)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoría (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Diseño, Desarrollo" {...field} value={field.value || ''} className="rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detalles del servicio..."
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
                                {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar' : 'Crear Servicio')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
