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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getImageUrl } from '@/lib/utils';

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

        // Validar tamaño máximo (2MB)
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
            // Capturar el error 413 o mensaje del backend si existe
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
        <div className="rounded-xl border bg-white dark:bg-zinc-900 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">

            {/* Section: Logo */}
            <div className="p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 border-b border-border/50 bg-zinc-50/30 dark:bg-zinc-900/30">
                <div className="relative group flex-shrink-0">
                    <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary/30 to-primary/0 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                    <Avatar
                        className="relative h-20 w-20 md:h-24 md:w-24 border-2 border-background shadow-sm cursor-pointer transition-all duration-300 group-hover:scale-[1.02]"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <AvatarImage src={getImageUrl(currentLogo)} alt={businessName} className="object-cover" />
                        <AvatarFallback className="text-2xl md:text-3xl font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div
                        className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-full bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {isUploadingLogo
                            ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                            : <Camera className="w-6 h-6 text-white" />
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
                <div>
                    <h3 className="text-lg font-medium tracking-tight">Identidad Visual</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        Sube el logo de tu negocio. Recomendamos una imagen cuadrada (JPG, PNG o WEBP) de al menos 400x400px, máx. 2MB.
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={isUploadingLogo}
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white/50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border shadow-sm transition-all active:scale-95"
                        >
                            {isUploadingLogo
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...</>
                                : <><Camera className="mr-2 h-4 w-4" /> Cambiar logo</>
                            }
                        </Button>
                    </div>
                </div>
            </div>

            {/* Section: Form Fields */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="p-6 md:p-8 space-y-8">
                        <FormField
                            control={form.control}
                            name="businessName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-base">Nombre Comercial</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ej. Agencia Creativa Blend"
                                            className="max-w-md transition-shadow focus-visible:ring-primary/20 focus-visible:border-primary"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
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
                                    <FormLabel className="text-base">Color de Marca</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-3 max-w-md">
                                            <div
                                                className="relative overflow-hidden rounded-lg border shadow-sm flex-shrink-0 w-11 h-11 transition-transform duration-200 hover:scale-[1.05] cursor-pointer"
                                                style={{ backgroundColor: field.value || '#000000' }}
                                                onClick={() => {
                                                    const input = document.getElementById('brand-color-input');
                                                    if (input) input.click();
                                                }}
                                            >
                                                <input
                                                    id="brand-color-input"
                                                    type="color"
                                                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                                    {...field}
                                                    value={field.value || '#000000'}
                                                />
                                            </div>
                                            <Input
                                                placeholder="#000000"
                                                className="font-mono uppercase transition-shadow focus-visible:ring-primary/20 focus-visible:border-primary"
                                                {...field}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    field.onChange(val && !val.startsWith('#') ? '#' + val : val);
                                                }}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        Define el color principal de tus botones y enlaces.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="px-6 py-5 md:px-8 flex justify-end bg-zinc-50/50 dark:bg-zinc-900/30 border-t items-center gap-4">
                        <p className="text-sm text-muted-foreground mr-auto opacity-70">
                            Los cambios se guardan automáticamente.
                        </p>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="transition-all hover:shadow-md active:scale-[0.98]"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Guardando...' : 'Guardar cambios'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
