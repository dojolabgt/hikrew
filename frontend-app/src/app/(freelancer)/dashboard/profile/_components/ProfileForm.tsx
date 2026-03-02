'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Camera, Loader2 } from 'lucide-react';

import {
    FreelancerProfile,
    UpdateFreelancerProfileDto
} from '@/features/freelancer-profile/types';
import { freelancerProfileApi } from '@/features/freelancer-profile/api';

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

const profileSchema = z.object({
    businessName: z.string().max(100, 'El nombre no puede exceder 100 caracteres').optional(),
    brandColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color hexadecimal inválido').optional().or(z.literal('')),
    logo: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
    initialData: FreelancerProfile | null;
    onUpdate: (updatedData: FreelancerProfile) => void;
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
            const payload: UpdateFreelancerProfileDto = {};
            if (data.businessName) payload.businessName = data.businessName;
            if (data.brandColor) payload.brandColor = data.brandColor;
            if (data.logo) payload.logo = data.logo;

            const updatedProfile = await freelancerProfileApi.updateProfile(payload);
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

        setIsUploadingLogo(true);
        try {
            const updatedProfile = await freelancerProfileApi.uploadLogo(file);
            form.setValue('logo', updatedProfile.logo ?? '');
            toast.success('Logo subido correctamente');
            onUpdate(updatedProfile);
        } catch (error: unknown) {
            console.error('Error uploading logo', error);
            const msg = error instanceof Error ? error.message : 'Error al subir el logo';
            toast.error(msg);
        } finally {
            setIsUploadingLogo(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="rounded-xl border bg-white dark:bg-zinc-900 divide-y divide-border">

            {/* Section: Logo */}
            <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative group flex-shrink-0">
                    <Avatar
                        className="h-20 w-20 border-2 border-muted cursor-pointer transition-opacity group-hover:opacity-75"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <AvatarImage src={currentLogo} alt={businessName} className="object-cover" />
                        <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
                <div>
                    <p className="font-medium text-sm">Logo del Negocio</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        JPG, PNG o WEBP · Máx. 2MB
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        disabled={isUploadingLogo}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {isUploadingLogo
                            ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Subiendo...</>
                            : 'Cambiar logo'
                        }
                    </Button>
                </div>
            </div>

            {/* Section: Form Fields */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="p-6 space-y-5">
                        <FormField
                            control={form.control}
                            name="businessName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre Comercial</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ej. Agencia Creativa Blend"
                                            {...field}
                                        />
                                    </FormControl>
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
                                        <div className="flex items-center gap-3 max-w-xs">
                                            <div className="relative overflow-hidden rounded-md border flex-shrink-0 w-9 h-9">
                                                <Input
                                                    type="color"
                                                    className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer border-0 p-0"
                                                    {...field}
                                                    value={field.value || '#000000'}
                                                />
                                            </div>
                                            <Input
                                                placeholder="#000000"
                                                {...field}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    field.onChange(val && !val.startsWith('#') ? '#' + val : val);
                                                }}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        Se usará en acentos visuales y botones de pago.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Separator />

                    <div className="px-6 py-4 flex justify-end bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-xl">
                        <Button type="submit" disabled={isLoading} size="sm">
                            {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                            {isLoading ? 'Guardando...' : 'Guardar cambios'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
