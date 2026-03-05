'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { clientsApi } from '@/features/clients/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import paisData from '@/data/localization/pais.json';
// @ts-ignore
import { Gt } from '@next-languages/flags';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';

// ─── Flag map (add more as new countries are enabled in pais.json) ─────────────

const FLAG_COMPONENTS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    GT: Gt,
};

function CountryFlag({ iso, className }: { iso: string; className?: string }) {
    const Flag = FLAG_COMPONENTS[iso?.toUpperCase()];
    if (!Flag) return null;
    return <Flag className={className} />;
}

// ─── Country + phone data ──────────────────────────────────────────────────────

function getCountryData(code: string) {
    return (paisData as any)[code] ?? null;
}

const ALL_COUNTRIES = Object.entries(paisData).map(([code, data]: [string, any]) => ({
    code,
    name: data.name,
    phoneCode: data.phoneFormat?.code ?? '',
    digits: data.phoneFormat?.digits ?? null,
}));

// Reverse map: "+502" → "GT"
const PREFIX_TO_ISO: Record<string, string> = {};
ALL_COUNTRIES.forEach(c => { if (c.phoneCode) PREFIX_TO_ISO[c.phoneCode] = c.code; });

// ─── PhonePrefixInput ─────────────────────────────────────────────────────────

function PhonePrefixInput({
    value,
    onChange,
    defaultPhoneCode,
    maxDigits,
}: {
    value: string;
    onChange: (val: string) => void;
    defaultPhoneCode: string;
    maxDigits?: number | null;
}) {
    const parts = value?.split('|') ?? [];
    const [prefix, setPrefix] = useState(parts[0] || defaultPhoneCode);
    const [local, setLocal] = useState(parts[1] || '');

    // Sync prefix when defaultPhoneCode changes and local is empty
    useEffect(() => {
        if (!value) {
            setPrefix(defaultPhoneCode);
            setLocal('');
        }
    }, [defaultPhoneCode]);

    const emit = (p: string, l: string) => onChange(l ? `${p}|${l}` : '');

    const currentIso = PREFIX_TO_ISO[prefix] ?? '';

    return (
        <div className="flex rounded-xl overflow-hidden border border-input focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-all">
            {/* Prefix selector */}
            <Select
                value={prefix}
                onValueChange={(v) => { setPrefix(v); emit(v, local); }}
            >
                <SelectTrigger className="w-[92px] shrink-0 border-0 border-r border-input rounded-none focus:ring-0 bg-muted/50 px-2 gap-1.5 text-sm font-medium">
                    <div className="flex items-center gap-1.5">
                        <CountryFlag iso={currentIso} className="w-4 h-3 rounded-[2px] object-cover" />
                        <span>{prefix}</span>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {ALL_COUNTRIES.filter(c => c.phoneCode).map(c => (
                        <SelectItem key={c.code} value={c.phoneCode}>
                            <div className="flex items-center gap-2">
                                <CountryFlag iso={c.code} className="w-4 h-3 rounded-[2px] object-cover" />
                                <span>{c.phoneCode}</span>
                                <span className="text-muted-foreground text-xs">{c.name}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Local number */}
            <input
                type="tel"
                placeholder="5555-1234"
                value={local}
                maxLength={maxDigits ?? undefined}
                onChange={(e) => { setLocal(e.target.value); emit(prefix, e.target.value); }}
                className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
        </div>
    );
}

// We will redefine the schema inside the component to use translations.
// type ClientFormValues = z.infer<typeof clientSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ClientModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClientModal({ open, onOpenChange, onSuccess, initialData }: ClientModalProps) {
    const { activeWorkspace } = useAuth();
    const { t } = useWorkspaceSettings();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Tax identifier: a single selector + value
    const [selectedTaxKey, setSelectedTaxKey] = useState<string>('');
    const [taxValue, setTaxValue] = useState('');

    // Ref to skip the country-change reset on form.reset()
    const skipTaxReset = useRef(false);

    const defaultCountry = activeWorkspace?.country || 'GT';

    // Dynamic schema for translations
    const clientSchema = z.object({
        name: z.string().min(2, t('clientModal.nameError')),
        email: z.string().email(t('clientModal.emailError')),
        phone: z.string().optional().nullable(),
        whatsapp: z.string().optional().nullable(),
        country: z.string().optional(),
        type: z.enum(['person', 'company']).default('person'),
        notes: z.string().optional().nullable(),
    });

    type ClientFormValues = z.infer<typeof clientSchema>;

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema as any),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            whatsapp: '',
            country: defaultCountry,
            type: 'person',
            notes: '',
        },
    });

    const watchedCountry = form.watch('country');
    const countryData = getCountryData(watchedCountry || defaultCountry);
    const defaultPhoneCode = countryData?.phoneFormat?.code ?? '+502';
    const maxDigits = countryData?.phoneFormat?.digits ?? null;

    // Reset tax selector when country changes (from user interaction, not from form.reset)
    useEffect(() => {
        if (skipTaxReset.current) {
            skipTaxReset.current = false;
            return;
        }
        setSelectedTaxKey('');
        setTaxValue('');
    }, [watchedCountry]);

    // Populate from initialData
    useEffect(() => {
        skipTaxReset.current = true; // prevent the country-change effect from wiping tax data
        if (initialData) {
            form.reset({
                name: initialData.name,
                email: initialData.email,
                phone: initialData.phone || '',
                whatsapp: initialData.whatsapp || '',
                country: initialData.country || defaultCountry,
                type: initialData.type || 'person',
                notes: initialData.notes || '',
            });
            const firstTax = initialData.taxIdentifiers?.[0];
            setSelectedTaxKey(firstTax?.key || '');
            setTaxValue(firstTax?.value || '');
        } else {
            form.reset({
                name: '',
                email: '',
                phone: '',
                whatsapp: '',
                country: defaultCountry,
                type: 'person',
                notes: '',
            });
            setSelectedTaxKey('');
            setTaxValue('');
        }
    }, [initialData, open]);

    const onSubmit = async (values: ClientFormValues) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...values,
                taxIdentifiers: selectedTaxKey && taxValue.trim()
                    ? [{ key: selectedTaxKey, value: taxValue.trim() }]
                    : [],
            };
            if (initialData?.id) {
                await clientsApi.update(initialData.id, payload as any);
                toast.success(t('clientModal.successUpdate'));
            } else {
                await clientsApi.create(payload as any);
                toast.success(t('clientModal.successCreate'));
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('clientModal.errorSave'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Tax identifier options from the selected country
    const taxOptions = countryData?.taxIdentifiers ?? [];
    const selectedTaxDef = taxOptions.find((t: any) => t.key === selectedTaxKey);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? t('clientModal.titleEdit') : t('clientModal.titleNew')}</DialogTitle>
                    <DialogDescription>{t('clientModal.desc')}</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">

                        {/* ── Nombre y correo ───────────────────────────── */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('clientModal.nameForm')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('clientModal.namePlaceholder')} {...field} value={field.value || ''} className="rounded-xl" />
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
                                    <FormLabel>{t('clientModal.emailForm')}</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder={t('clientModal.emailPlaceholder')} {...field} value={field.value || ''} className="rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* ── Teléfonos ─────────────────────────────────── */}
                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('clientModal.phoneForm')}</FormLabel>
                                        <FormControl>
                                            <PhonePrefixInput
                                                value={field.value || ''}
                                                onChange={field.onChange}
                                                defaultPhoneCode={defaultPhoneCode}
                                                maxDigits={maxDigits}
                                            />
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
                                        <FormLabel>{t('clientModal.whatsappForm')}</FormLabel>
                                        <FormControl>
                                            <PhonePrefixInput
                                                value={field.value || ''}
                                                onChange={field.onChange}
                                                defaultPhoneCode={defaultPhoneCode}
                                                maxDigits={maxDigits}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* ── País y Tipo ───────────────────────────────── */}
                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('clientModal.countryForm')}</FormLabel>
                                        <FormControl>
                                            <Select value={field.value || ''} onValueChange={field.onChange}>
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder={t('clientModal.countryPlaceholder')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ALL_COUNTRIES.map(({ code, name }) => (
                                                        <SelectItem key={code} value={code}>
                                                            <div className="flex items-center gap-2">
                                                                <CountryFlag iso={code} className="w-4 h-3 rounded-[2px] object-cover" />
                                                                {name}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            {t('clientModal.countryDesc')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('clientModal.typeForm')}</FormLabel>
                                        <FormControl>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="person">{t('clientModal.typePerson')}</SelectItem>
                                                    <SelectItem value="company">{t('clientModal.typeCompany')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* ── Identificación fiscal (select + input dinámico) ── */}
                        {taxOptions.length > 0 && (
                            <div className="space-y-2.5 rounded-xl border border-border/60 bg-muted/20 p-4">
                                <p className="text-sm font-medium">{t('clientModal.taxIdTitle')}</p>
                                <div className="flex gap-2">
                                    {/* Which identifier */}
                                    <Select value={selectedTaxKey} onValueChange={(v) => { setSelectedTaxKey(v); setTaxValue(''); }}>
                                        <SelectTrigger className="w-[180px] rounded-xl">
                                            <SelectValue placeholder={t('clientModal.taxIdPlaceholder')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">{t('clientModal.taxIdNone')}</SelectItem>
                                            {taxOptions.map((t: any) => (
                                                <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Value input — only shown when a key is selected */}
                                    {selectedTaxKey && selectedTaxKey !== 'none' && (
                                        <Input
                                            placeholder={selectedTaxDef?.placeholder ?? ''}
                                            value={taxValue}
                                            onChange={e => setTaxValue(e.target.value)}
                                            className="flex-1 rounded-xl"
                                        />
                                    )}
                                </div>
                                {selectedTaxDef?.description && (
                                    <p className="text-xs text-muted-foreground">{selectedTaxDef.description}</p>
                                )}
                            </div>
                        )}

                        {/* ── Notas ─────────────────────────────────────── */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('clientModal.notesForm')}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t('clientModal.notesPlaceholder')}
                                            {...field}
                                            value={field.value || ''}
                                            className="rounded-xl resize-none h-20"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-2">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-full shadow-lg shadow-primary/20"
                            >
                                {isSubmitting ? t('clientModal.saving') : (initialData ? t('clientModal.updateBtn') : t('clientModal.createBtn'))}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
