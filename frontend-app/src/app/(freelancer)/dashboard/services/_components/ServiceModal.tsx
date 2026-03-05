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
    FormMessage,
    FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceUnitType, ServiceChargeType } from '@/features/services/types';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';
import { servicesApi } from '@/features/services/api';
import { toast } from 'sonner';

const serviceSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    sku: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    basePrice: z.coerce.number().min(0, 'El precio no puede ser negativo'),
    currency: z.string(),
    unitType: z.nativeEnum(ServiceUnitType),
    chargeType: z.nativeEnum(ServiceChargeType),
    internalCost: z.coerce.number().min(0).optional(),
    isTaxable: z.boolean().default(true),
    category: z.string().optional().nullable(),
    estimatedDeliveryDays: z.coerce.number().min(0).optional().nullable(),
    specificTerms: z.string().optional().nullable(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;
type ServiceFormInput = z.input<typeof serviceSchema>;

interface ServiceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export function ServiceModal({ open, onOpenChange, onSuccess, initialData }: ServiceModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { workspace, defaultCurrencyCode, t } = useWorkspaceSettings();
    const currencies = workspace?.currencies || [{ code: 'GTQ', name: 'Quetzales', symbol: 'Q', isDefault: true }];

    const form = useForm<ServiceFormInput, any, ServiceFormValues>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: '',
            sku: '',
            description: '',
            basePrice: 0,
            currency: defaultCurrencyCode,
            unitType: ServiceUnitType.UNIT,
            chargeType: ServiceChargeType.ONE_TIME,
            internalCost: 0,
            isTaxable: true,
            category: '',
            estimatedDeliveryDays: null,
            specificTerms: '',
        },
    });

    // Update form values when initialData changes
    useEffect(() => {
        if (initialData && open) {
            form.reset({
                name: initialData.name,
                sku: initialData.sku || '',
                description: initialData.description || '',
                currency: initialData.currency || defaultCurrencyCode,
                unitType: initialData.unitType || ServiceUnitType.UNIT,
                chargeType: initialData.chargeType || ServiceChargeType.ONE_TIME,
                internalCost: Number(initialData.internalCost || 0),
                isTaxable: initialData.isTaxable !== undefined ? initialData.isTaxable : true,
                category: initialData.category || '',
                estimatedDeliveryDays: initialData.estimatedDeliveryDays || null,
                specificTerms: initialData.specificTerms || '',
            });
        } else if (open) {
            form.reset({
                name: '',
                sku: '',
                description: '',
                basePrice: 0,
                currency: defaultCurrencyCode,
                unitType: ServiceUnitType.UNIT,
                chargeType: ServiceChargeType.ONE_TIME,
                internalCost: 0,
                isTaxable: true,
                category: '',
                estimatedDeliveryDays: null,
                specificTerms: '',
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
            <DialogContent className="sm:max-w-[600px] rounded-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? t('serviceModal.editTitle') : t('serviceModal.newTitle')}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-4 rounded-xl">
                                <TabsTrigger value="basic" className="rounded-lg">{t('serviceModal.tabBasic')}</TabsTrigger>
                                <TabsTrigger value="pricing" className="rounded-lg">{t('serviceModal.tabPricing')}</TabsTrigger>
                                <TabsTrigger value="advanced" className="rounded-lg">{t('serviceModal.tabAdvanced')}</TabsTrigger>
                            </TabsList>

                            {/* BÁSICO TAB */}
                            <TabsContent value="basic" className="space-y-4 mt-0">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('serviceModal.nameLabel')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t('serviceModal.namePlaceholder')} {...field} value={field.value || ''} className="rounded-xl" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="sku"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('serviceModal.skuLabel')}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={t('serviceModal.skuPlaceholder')} {...field} value={field.value || ''} className="rounded-xl" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('serviceModal.categoryLabel')}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={t('serviceModal.categoryPlaceholder')} {...field} value={field.value || ''} className="rounded-xl" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('serviceModal.descLabel')}</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder={t('serviceModal.descPlaceholder')}
                                                    {...field}
                                                    value={field.value || ''}
                                                    className="rounded-xl resize-none h-24"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>

                            {/* PRECIOS TAB */}
                            <TabsContent value="pricing" className="space-y-4 mt-0">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="basePrice"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('serviceModal.priceLabel')}</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} value={field.value as string | number | undefined} className="rounded-xl" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="internalCost"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('serviceModal.costLabel')}</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} value={(field.value === null ? '' : field.value) as string | number | undefined} className="rounded-xl" />
                                                </FormControl>
                                                <FormDescription className="text-xs">{t('serviceModal.costDesc')}</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="chargeType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('serviceModal.chargeTypeLabel')}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl">
                                                            <SelectValue placeholder="Selecciona..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value={ServiceChargeType.ONE_TIME}>{t('serviceModal.chargeOneTime')}</SelectItem>
                                                        <SelectItem value={ServiceChargeType.HOURLY}>{t('serviceModal.chargeHourly')}</SelectItem>
                                                        <SelectItem value={ServiceChargeType.RECURRING}>{t('serviceModal.chargeRecurring')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="unitType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('serviceModal.unitLabel')}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl">
                                                            <SelectValue placeholder="Selecciona..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value={ServiceUnitType.UNIT}>{t('serviceModal.unitUnit')}</SelectItem>
                                                        <SelectItem value={ServiceUnitType.HOUR}>{t('serviceModal.unitHour')}</SelectItem>
                                                        <SelectItem value={ServiceUnitType.PROJECT}>{t('serviceModal.unitProject')}</SelectItem>
                                                        <SelectItem value={ServiceUnitType.MONTH}>{t('serviceModal.unitMonth')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="currency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('serviceModal.currencyLabel')}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl">
                                                            <SelectValue placeholder="GTQ" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl">
                                                        {currencies.map((c: any) => (
                                                            <SelectItem key={c.code} value={c.code}>
                                                                {c.code} ({c.symbol})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="isTaxable"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border p-3 shadow-sm mt-6">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-sm font-medium">{t('serviceModal.taxableLabel')}</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            {/* AVANZADO TAB */}
                            <TabsContent value="advanced" className="space-y-4 mt-0">
                                <FormField
                                    control={form.control}
                                    name="estimatedDeliveryDays"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('serviceModal.deliveryDaysLabel')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder={t('serviceModal.deliveryDaysPlaceholder')}
                                                    {...field}
                                                    value={(field.value === null ? '' : field.value) as string | number | undefined}
                                                    className="rounded-xl"
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">{t('serviceModal.deliveryDaysDesc')}</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="specificTerms"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('serviceModal.termsLabel')}</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder={t('serviceModal.termsPlaceholder')}
                                                    {...field}
                                                    value={field.value || ''}
                                                    className="rounded-xl resize-none h-24"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>
                        </Tabs>

                        <DialogFooter className="pt-6">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-full shadow-lg shadow-primary/20"
                            >
                                {isSubmitting ? t('serviceModal.btnSaving') : (initialData ? t('serviceModal.btnUpdate') : t('serviceModal.btnCreate'))}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
