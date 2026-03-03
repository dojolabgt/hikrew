'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Globe, Hash, Plus, Trash2, Star, Check, Loader2 } from 'lucide-react';

import { Workspace } from '@/features/workspaces/types';
import { workspacesApi } from '@/features/workspaces/api';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { AppSelect, SelectOption } from '@/components/common/AppSelect';
import { PrimaryButton } from '@/components/common/PrimaryButton';

import paisData from '@/data/localization/pais.json';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CurrencyEntry {
    code: string;
    name: string;
    symbol: string;
    isDefault: boolean;
}

// ─── Config Data ─────────────────────────────────────────────────────────────

const LANGUAGES: SelectOption[] = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'es-419', label: 'Español (Latinoamérica)' },
];

const TIMEZONES: SelectOption[] = [
    { value: 'America/Guatemala', label: 'Guatemala (GMT-6)' },
    { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
    { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
    { value: 'America/Lima', label: 'Lima (GMT-5)' },
    { value: 'America/Santiago', label: 'Santiago (GMT-3)' },
    { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
    { value: 'America/New_York', label: 'New York, Eastern (GMT-5)' },
    { value: 'America/Chicago', label: 'Chicago, Central (GMT-6)' },
    { value: 'America/Denver', label: 'Denver, Mountain (GMT-7)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles, Pacific (GMT-8)' },
    { value: 'Europe/London', label: 'London (GMT+0)' },
    { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
    { value: 'Europe/Berlin', label: 'Berlin (GMT+1)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
    { value: 'Australia/Sydney', label: 'Sydney (GMT+11)' },
];

const DATE_FORMATS: SelectOption[] = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', description: '12/25/2024' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', description: '25/12/2024' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', description: '2024-12-25' },
    { value: 'DD MMM YYYY', label: 'DD MMM YYYY', description: '25 Dec 2024' },
    { value: 'MMMM DD, YYYY', label: 'MMMM DD, YYYY', description: 'December 25, 2024' },
];

const TIME_FORMATS: SelectOption[] = [
    { value: '12h', label: '12 horas', description: '3:30 PM' },
    { value: '24h', label: '24 horas', description: '15:30' },
];

const NUMBER_FORMATS: SelectOption[] = [
    { value: 'US', label: '1,234.56', description: 'US' },
    { value: 'EU', label: '1.234,56', description: 'Europeo' },
    { value: 'FR', label: '1 234,56', description: 'Francés' },
    { value: 'CH', label: "1'234.56", description: 'Suizo' },
];

const CURRENCY_FORMATS: SelectOption[] = [
    { value: 'symbol-left', label: '$1,234.56' },
    { value: 'symbol-right', label: '1,234.56 $' },
    { value: 'code-left', label: 'USD 1,234.56' },
    { value: 'code-right', label: '1,234.56 USD' },
];

const FIRST_DAY_OPTIONS: SelectOption[] = [
    { value: 'sunday', label: 'Domingo' },
    { value: 'monday', label: 'Lunes' },
    { value: 'saturday', label: 'Sábado' },
];

const ALL_CURRENCIES: CurrencyEntry[] = [
    { code: 'GTQ', name: 'Quetzal guatemalteco', symbol: 'Q', isDefault: false },
    { code: 'USD', name: 'Dólar estadounidense', symbol: '$', isDefault: false },
    { code: 'EUR', name: 'Euro', symbol: '€', isDefault: false },
    { code: 'MXN', name: 'Peso mexicano', symbol: '$', isDefault: false },
    { code: 'GBP', name: 'Libra esterlina', symbol: '£', isDefault: false },
    { code: 'JPY', name: 'Yen japonés', symbol: '¥', isDefault: false },
    { code: 'CAD', name: 'Dólar canadiense', symbol: '$', isDefault: false },
    { code: 'AUD', name: 'Dólar australiano', symbol: '$', isDefault: false },
    { code: 'CHF', name: 'Franco suizo', symbol: 'Fr', isDefault: false },
    { code: 'CNY', name: 'Yuan chino', symbol: '¥', isDefault: false },
    { code: 'BRL', name: 'Real brasileño', symbol: 'R$', isDefault: false },
    { code: 'COP', name: 'Peso colombiano', symbol: '$', isDefault: false },
    { code: 'ARS', name: 'Peso argentino', symbol: '$', isDefault: false },
    { code: 'PEN', name: 'Sol peruano', symbol: 'S/', isDefault: false },
    { code: 'CLP', name: 'Peso chileno', symbol: '$', isDefault: false },
    { code: 'CRC', name: 'Colón costarricense', symbol: '₡', isDefault: false },
    { code: 'HNL', name: 'Lempira hondureño', symbol: 'L', isDefault: false },
    { code: 'NIO', name: 'Córdoba nicaragüense', symbol: 'C$', isDefault: false },
    { code: 'DOP', name: 'Peso dominicano', symbol: 'RD$', isDefault: false },
    { code: 'KRW', name: 'Won surcoreano', symbol: '₩', isDefault: false },
    { code: 'INR', name: 'Rupia india', symbol: '₹', isDefault: false },
    { code: 'SAR', name: 'Riyal saudí', symbol: '﷼', isDefault: false },
    { code: 'AED', name: 'Dírham UAE', symbol: 'د.إ', isDefault: false },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const localizationSchema = z.object({
    country: z.string().min(1, 'El país es requerido'),
    language: z.string().min(1),
    timezone: z.string().min(1),
    firstDayOfWeek: z.string(),
    dateFormat: z.string(),
    timeFormat: z.string(),
    numberFormat: z.string(),
    currencyFormat: z.string(),
});

type LocalizationFormValues = z.infer<typeof localizationSchema>;

interface LocalizationFormProps {
    initialData: Workspace | null;
    onUpdate: (updatedData: Workspace) => void;
}

// ─── Preview helpers ──────────────────────────────────────────────────────────

function previewDate(fmt: string) {
    const map: Record<string, string> = {
        'MM/DD/YYYY': '12/25/2024',
        'DD/MM/YYYY': '25/12/2024',
        'YYYY-MM-DD': '2024-12-25',
        'DD MMM YYYY': '25 Dec 2024',
        'MMMM DD, YYYY': 'December 25, 2024',
    };
    return map[fmt] ?? '12/25/2024';
}

function previewTime(fmt: string) {
    return fmt === '24h' ? '15:30' : '3:30 PM';
}

function previewNumber(fmt: string) {
    const map: Record<string, string> = {
        EU: '1.234,56',
        FR: '1\u00a0234,56',
        CH: "1'234.56",
        US: '1,234.56',
    };
    return map[fmt] ?? '1,234.56';
}

function previewCurrency(fmt: string, numFmt: string) {
    const num = previewNumber(numFmt);
    const map: Record<string, string> = {
        'symbol-right': `${num} $`,
        'code-left': `USD ${num}`,
        'code-right': `${num} USD`,
        'symbol-left': `$${num}`,
    };
    return map[fmt] ?? `$${num}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LocalizationForm({ initialData, onUpdate }: LocalizationFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [currencies, setCurrencies] = useState<CurrencyEntry[]>(
        () => (initialData?.currencies ?? []) as CurrencyEntry[]
    );
    const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>('');

    const form = useForm<LocalizationFormValues>({
        resolver: zodResolver(localizationSchema),
        defaultValues: {
            country: initialData?.country || 'GT',
            language: initialData?.language || 'en-US',
            timezone: initialData?.timezone || 'America/Guatemala',
            firstDayOfWeek: initialData?.firstDayOfWeek || 'sunday',
            dateFormat: initialData?.dateFormat || 'MM/DD/YYYY',
            timeFormat: initialData?.timeFormat || '12h',
            numberFormat: initialData?.numberFormat || 'US',
            currencyFormat: initialData?.currencyFormat || 'symbol-left',
        },
    });

    const watchDate = form.watch('dateFormat');
    const watchTime = form.watch('timeFormat');
    const watchNum = form.watch('numberFormat');
    const watchCurr = form.watch('currencyFormat');

    const countryOptions: SelectOption[] = Object.entries(paisData).map(
        ([code, data]: [string, any]) => ({ value: code, label: data.name })
    );

    const availableCurrencyOptions: SelectOption[] = ALL_CURRENCIES
        .filter(c => !currencies.some(e => e.code === c.code))
        .map(c => ({ value: c.code, label: c.name, description: `${c.code} ${c.symbol}` }));

    function addCurrency() {
        if (!selectedCurrencyCode) return;
        const found = ALL_CURRENCIES.find(c => c.code === selectedCurrencyCode);
        if (!found) return;
        setCurrencies(prev => [...prev, { ...found, isDefault: prev.length === 0 }]);
        setSelectedCurrencyCode('');
    }

    function removeCurrency(code: string) {
        setCurrencies(prev => {
            const next = prev.filter(c => c.code !== code);
            if (prev.find(c => c.code === code)?.isDefault && next.length > 0) {
                next[0].isDefault = true;
            }
            return next;
        });
    }

    function setDefault(code: string) {
        setCurrencies(prev => prev.map(c => ({ ...c, isDefault: c.code === code })));
    }

    async function onSubmit(data: LocalizationFormValues) {
        setIsLoading(true);
        try {
            const updatedProfile = await workspacesApi.updateWorkspace({
                ...data,
                currencies,
            } as Partial<Workspace>);
            toast.success('Configuración guardada');
            onUpdate(updatedProfile);
        } catch (error) {
            console.error('Error updating localization:', error);
            toast.error('Error al guardar la configuración');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* ── Ubicación ──────────────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Globe className="w-4 h-4 text-primary" />
                            Ubicación
                        </CardTitle>
                        <CardDescription>
                            Define el país principal de operación de tu negocio.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>País</FormLabel>
                                        <FormControl>
                                            <AppSelect
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                options={countryOptions}
                                                placeholder="Selecciona un país"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* ── Idioma y Región ────────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Globe className="w-4 h-4 text-primary" />
                            Idioma y Región
                        </CardTitle>
                        <CardDescription>
                            Ajusta el idioma, zona horaria y primer día de la semana.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="language"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Idioma</FormLabel>
                                        <FormControl>
                                            <AppSelect
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                options={LANGUAGES}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="firstDayOfWeek"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Inicio de Semana</FormLabel>
                                        <FormControl>
                                            <AppSelect
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                options={FIRST_DAY_OPTIONS}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="timezone"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Zona Horaria</FormLabel>
                                        <FormControl>
                                            <AppSelect
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                options={TIMEZONES}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* ── Formatos ──────────────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Hash className="w-4 h-4 text-primary" />
                            Formatos de Visualización
                        </CardTitle>
                        <CardDescription>
                            Controla cómo se muestran fechas, horas, números y montos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="dateFormat"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Formato de Fecha</FormLabel>
                                        <FormControl>
                                            <AppSelect
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                options={DATE_FORMATS}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="timeFormat"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Formato de Hora</FormLabel>
                                        <FormControl>
                                            <AppSelect
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                options={TIME_FORMATS}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="numberFormat"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Formato de Número</FormLabel>
                                        <FormControl>
                                            <AppSelect
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                options={NUMBER_FORMATS}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="currencyFormat"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Formato de Moneda</FormLabel>
                                        <FormControl>
                                            <AppSelect
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                options={CURRENCY_FORMATS}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Live preview */}
                        <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                Vista Previa
                            </p>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
                                <span className="text-muted-foreground">Fecha</span>
                                <span className="font-medium">{previewDate(watchDate)}</span>
                                <span className="text-muted-foreground">Hora</span>
                                <span className="font-medium">{previewTime(watchTime)}</span>
                                <span className="text-muted-foreground">Número</span>
                                <span className="font-medium">{previewNumber(watchNum)}</span>
                                <span className="text-muted-foreground">Moneda</span>
                                <span className="font-medium">{previewCurrency(watchCurr, watchNum)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Monedas ────────────────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <span className="text-primary font-semibold text-sm">$</span>
                            Monedas Activas
                        </CardTitle>
                        <CardDescription>
                            Define las monedas habilitadas para tus cotizaciones. La moneda predeterminada se usa en documentos nuevos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <div className="flex-1 max-w-xs">
                                <AppSelect
                                    value={selectedCurrencyCode}
                                    onValueChange={setSelectedCurrencyCode}
                                    options={availableCurrencyOptions}
                                    placeholder="Agregar moneda..."
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addCurrency}
                                disabled={!selectedCurrencyCode}
                                className="gap-1.5 h-10"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Agregar
                            </Button>
                        </div>

                        {currencies.length > 0 ? (
                            <div className="rounded-lg border border-border/50 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/40 border-b border-border/40">
                                            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">Código</th>
                                            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">Moneda</th>
                                            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">Símbolo</th>
                                            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">Por defecto</th>
                                            <th className="px-4 py-2.5" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currencies.map(c => (
                                            <tr
                                                key={c.code}
                                                className={`border-b border-border/30 last:border-0 transition-colors ${c.isDefault ? 'bg-primary/5' : 'hover:bg-muted/20'}`}
                                            >
                                                <td className="px-4 py-3">
                                                    <span className="font-mono font-semibold text-xs tracking-wider">{c.code}</span>
                                                </td>
                                                <td className="px-4 py-3 text-foreground">{c.name}</td>
                                                <td className="px-4 py-3 font-medium">{c.symbol}</td>
                                                <td className="px-4 py-3">
                                                    {c.isDefault ? (
                                                        <Badge variant="default" className="gap-1 text-xs py-0.5">
                                                            <Check className="w-3 h-3" />
                                                            Predeterminada
                                                        </Badge>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs text-muted-foreground gap-1"
                                                            onClick={() => setDefault(c.code)}
                                                        >
                                                            <Star className="w-3 h-3" />
                                                            Establecer
                                                        </Button>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                        onClick={() => removeCurrency(c.code)}
                                                        disabled={currencies.length === 1}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
                                <p className="text-sm text-muted-foreground">
                                    No hay monedas configuradas. Agrega al menos una para usar en tus cotizaciones.
                                </p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="justify-between border-t border-border/40 pt-6">
                        <p className="text-xs text-muted-foreground">Asegúrate de guardar tus cambios.</p>
                        <PrimaryButton compact type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Configuración'
                            )}
                        </PrimaryButton>
                    </CardFooter>
                </Card>

            </form>
        </Form>
    );
}