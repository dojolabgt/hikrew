'use client';

import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Camera, Loader2 } from 'lucide-react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { usersApi } from '@/features/users/api';
import { getImageUrl } from '@/lib/utils';
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

const accountSchema = z.object({
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
    lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').max(100),
    email: z.string().email('Correo electrónico inválido').min(1, 'El correo es obligatorio'),
});

type AccountFormValues = z.infer<typeof accountSchema>;

export function AccountDetailsForm() {
    const { user, checkAuth } = useAuth();
    const { t } = useWorkspaceSettings();
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<AccountFormValues>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
        },
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_SIZE_MB = 2;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            toast.error(t('personalInfo.photoErrorSize'));
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUploadingImage(true);
        try {
            await usersApi.uploadProfileImage(file);
            toast.success(t('personalInfo.photoSuccess'));
            await checkAuth();
        } catch (error: any) {
            console.error('Error uploading profile image', error);
            const backendMsg = error?.response?.data?.message;
            const msg = typeof backendMsg === 'string' ? backendMsg :
                (error?.response?.status === 413 ? t('personalInfo.photoErrorLarge') : t('personalInfo.photoError'));
            toast.error(msg);
        } finally {
            setIsUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const onSubmit = async (values: AccountFormValues) => {
        setIsSaving(true);
        try {
            await usersApi.updateProfile({
                firstName: values.firstName,
                lastName: values.lastName,
                ...(values.email !== user?.email ? { email: values.email } : {})
            });
            toast.success(t('personalInfo.successSave'));
            await checkAuth();
        } catch (error: any) {
            console.error('Error updating profile', error);
            toast.error(error?.response?.data?.message || t('personalInfo.errorSave'));
        } finally {
            setIsSaving(false);
        }
    };

    const initials = ((user?.firstName || user?.email || 'U')[0] + (user?.lastName?.[0] || '')).toUpperCase();
    const currentImage = getImageUrl(user?.profileImage);

    return (
        <div className="space-y-6">

            {/* ── Foto Personal ─────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('personalInfo.photoTitle')}</CardTitle>
                    <CardDescription>
                        {t('personalInfo.photoDesc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative group inline-flex flex-shrink-0">
                        <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary/30 to-primary/0 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500" />
                        <Avatar
                            className="relative h-20 w-20 border-2 border-background shadow-sm cursor-pointer transition-all duration-300 group-hover:scale-[1.02]"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <AvatarImage
                                src={currentImage}
                                alt={user?.firstName ? `${user.firstName} ${user?.lastName ?? ''}` : 'Usuario'}
                                className="object-cover"
                            />
                            <AvatarFallback className="text-2xl font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div
                            className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {isUploadingImage
                                ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                                : <Camera className="w-5 h-5 text-white" />
                            }
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            className="hidden"
                            accept="image/png, image/jpeg, image/jpg, image/webp"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* ── Información Personal ───────────────────────────── */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('personalInfo.formTitle')}</CardTitle>
                            <CardDescription>
                                {t('personalInfo.formDesc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('personalInfo.firstNameLabel')}</FormLabel>
                                            <FormControl>
                                                <AppInput placeholder={t('personalInfo.firstNamePlaceholder')} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('personalInfo.lastNameLabel')}</FormLabel>
                                            <FormControl>
                                                <AppInput placeholder={t('personalInfo.lastNamePlaceholder')} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>{t('personalInfo.emailLabel')}</FormLabel>
                                            <FormControl>
                                                <AppInput
                                                    placeholder={t('personalInfo.emailPlaceholder')}
                                                    type="email"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                {t('personalInfo.emailDesc')}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between border-t border-border/40 pt-6">
                            <p className="text-xs text-muted-foreground">{t('personalInfo.footerNote')}</p>
                            <PrimaryButton compact type="submit" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('personalInfo.btnSaving')}
                                    </>
                                ) : (
                                    t('personalInfo.btnSave')
                                )}
                            </PrimaryButton>
                        </CardFooter>
                    </Card>
                </form>
            </Form>

        </div>
    );
}