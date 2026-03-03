'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Camera, Loader2 } from 'lucide-react';

import { Workspace } from '@/features/workspaces/types';
import { workspacesApi } from '@/features/workspaces/api';

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getImageUrl } from '@/lib/utils';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { AppInput } from '@/components/common/AppInput';
import { PrimaryButton } from '@/components/common/PrimaryButton';

const profileSchema = z.object({
    businessName: z.string().max(100, 'El nombre no puede exceder 100 caracteres').optional(),
    brandColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color hexadecimal inválido').optional().or(z.literal('')),
    logo: z.string().optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
    initialData: Workspace | null;
    onUpdate: (updatedData: Workspace) => void;
}

export function ProfileForm({ initialData, onUpdate }: ProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            businessName: initialData?.businessName || '',
            brandColor: initialData?.brandColor || '',
            logo: initialData?.logo || '',
        },
    });

    const currentLogo = form.watch('logo');
    const businessName = form.watch('businessName') || 'Freelancer';
    const initials = businessName.substring(0, 2).toUpperCase();

    async function onSubmit(data: ProfileFormValues) {
        setIsLoading(true);
        try {
            const payload: Partial<Workspace> = {};
            if (data.businessName) payload.businessName = data.businessName;
            if (data.brandColor) payload.brandColor = data.brandColor;
            if (data.logo) payload.logo = data.logo;

            const updatedProfile = await workspacesApi.updateWorkspace(payload);
            toast.success('Perfil comercial actualizado');
            onUpdate(updatedProfile);
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Ocurrió un error al actualizar los datos');
        } finally {
            setIsLoading(false);
        }
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_SIZE_MB = 2;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            toast.error(`La imagen excede el límite de ${MAX_SIZE_MB}MB. Por favor, elige una más pequeña.`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUploadingLogo(true);
        try {
            const updatedProfile = await workspacesApi.uploadLogo(file);
            form.setValue('logo', updatedProfile.logo ?? '');
            toast.success('Logo subido correctamente');
            onUpdate(updatedProfile);
        } catch (error: any) {
            console.error('Error uploading logo', error);
            const backendMsg = error?.response?.data?.message;
            const msg = typeof backendMsg === 'string' ? backendMsg :
                (error?.response?.status === 413 ? 'El archivo es demasiado grande para el servidor.' : 'Error al subir el logo');
            toast.error(msg);
        } finally {
            setIsUploadingLogo(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">

            {/* ── Identidad Visual ───────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle>Identidad Visual</CardTitle>
                    <CardDescription>
                        Sube el logo de tu negocio. Recomendamos una imagen cuadrada (JPG, PNG o WEBP) de al menos 400×400px, máx. 2MB.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-5">
                        <div className="relative group inline-flex flex-shrink-0">
                            <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary/30 to-primary/0 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500" />
                            <Avatar
                                className="relative h-20 w-20 border-2 border-background shadow-sm cursor-pointer transition-all duration-300 group-hover:scale-[1.02]"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <AvatarImage src={getImageUrl(currentLogo)} alt={businessName} className="object-cover" />
                                <AvatarFallback className="text-2xl font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div
                                className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {isUploadingLogo
                                    ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                                    : <Camera className="w-5 h-5 text-white" />
                                }
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleLogoUpload}
                                className="hidden"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                            />
                        </div>
                        <button
                            type="button"
                            disabled={isUploadingLogo}
                            onClick={() => fileInputRef.current?.click()}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        >
                            {isUploadingLogo ? 'Subiendo...' : 'Cambiar logo'}
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Detalles de Marca ──────────────────────────────── */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles de Marca</CardTitle>
                            <CardDescription>
                                Configura cómo se ve tu marca en cotizaciones y perfiles de clientes.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="businessName"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>Nombre Comercial</FormLabel>
                                            <FormControl>
                                                <AppInput
                                                    placeholder="Ej. Agencia Creativa Blend"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Este nombre aparecerá en tus cotizaciones y portales de pago.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="brandColor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Color de Marca</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="relative overflow-hidden rounded-md border shadow-sm flex-shrink-0 w-10 h-10 cursor-pointer hover:scale-105 transition-transform"
                                                        style={{ backgroundColor: field.value || '#000000' }}
                                                        onClick={() => document.getElementById('brand-color-input')?.click()}
                                                    >
                                                        <input
                                                            id="brand-color-input"
                                                            type="color"
                                                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                                            {...field}
                                                            value={field.value || '#000000'}
                                                        />
                                                    </div>
                                                    <AppInput
                                                        placeholder="#000000"
                                                        className="font-mono uppercase"
                                                        {...field}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            field.onChange(val && !val.startsWith('#') ? '#' + val : val);
                                                        }}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Color principal de tus botones y enlaces.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
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
                                    'Guardar cambios'
                                )}
                            </PrimaryButton>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}