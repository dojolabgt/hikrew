'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Camera, Loader2 } from 'lucide-react';

import { Workspace } from '@/features/workspaces/types';
import { workspacesApi } from '@/features/workspaces/api';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';

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

type ProfileFormValues = {
    businessName?: string;
    brandColor?: string;
    logo?: string;
};

interface ProfileFormProps {
    initialData: Workspace | null;
    onUpdate: (updatedData: Workspace) => void;
}

export function ProfileForm({ initialData, onUpdate }: ProfileFormProps) {
    const { t } = useWorkspaceSettings();
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const profileSchema = z.object({
        businessName: z.string().max(100, t('branding.valNameMax')).optional(),
        brandColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, t('branding.valColorRegex')).optional().or(z.literal('')),
        logo: z.string().optional().or(z.literal('')),
    });

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
            toast.success(t('branding.successUpdate'));
            onUpdate(updatedProfile);
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(t('branding.errorUpdate'));
        } finally {
            setIsLoading(false);
        }
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_SIZE_MB = 2;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            toast.error(t('branding.photoErrorSize'));
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUploadingLogo(true);
        try {
            const updatedProfile = await workspacesApi.uploadLogo(file);
            form.setValue('logo', updatedProfile.logo ?? '');
            toast.success(t('branding.photoSuccess'));
            onUpdate(updatedProfile);
        } catch (error: any) {
            console.error('Error uploading logo', error);
            const backendMsg = error?.response?.data?.message;
            const msg = typeof backendMsg === 'string' ? backendMsg :
                (error?.response?.status === 413 ? t('branding.photoErrorLarge') : t('branding.photoError'));
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
                    <CardTitle>{t('branding.cardTitleIdentity')}</CardTitle>
                    <CardDescription>
                        {t('branding.cardDescIdentity')}
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
                            {isUploadingLogo ? t('branding.btnUploading') : t('branding.btnChangeLogo')}
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Detalles de Marca ──────────────────────────────── */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('branding.cardTitleDetails')}</CardTitle>
                            <CardDescription>
                                {t('branding.cardDescDetails')}
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="businessName"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>{t('branding.nameLabel')}</FormLabel>
                                            <FormControl>
                                                <AppInput
                                                    placeholder={t('branding.namePlaceholder')}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                {t('branding.nameDesc')}
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
                                            <FormLabel>{t('branding.colorLabel')}</FormLabel>
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
                                                {t('branding.colorDesc')}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>

                        <CardFooter className="justify-between border-t border-border/40 pt-6">
                            <p className="text-xs text-muted-foreground">{t('branding.footerNote')}</p>
                            <PrimaryButton compact type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('branding.btnSaving')}
                                    </>
                                ) : (
                                    t('branding.btnSave')
                                )}
                            </PrimaryButton>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}