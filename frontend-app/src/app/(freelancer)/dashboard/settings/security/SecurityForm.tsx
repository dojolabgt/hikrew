'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Key, Link as LinkIcon, CheckCircle2 } from 'lucide-react';

import { usersApi } from '@/features/users/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
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

export function SecurityForm() {
    const { user } = useAuth();
    const { t } = useWorkspaceSettings();
    const [isSaving, setIsSaving] = useState(false);

    const hasGoogle = user?.authProviders?.includes('google') || false;
    const hasPassword = user?.hasPassword !== false && (user?.authProviders?.includes('password') || !user?.authProviders);

    const securitySchema = z.object({
        currentPassword: hasPassword ? z.string().min(1, t('security.valCurrentReq')) : z.string().optional(),
        newPassword: z.string().min(8, t('security.valNewReq'))
            .regex(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, t('security.valNewRegex')),
        confirmPassword: z.string().min(1, t('security.valConfirmReq')),
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: t('security.valMatch'),
        path: ['confirmPassword'],
    });

    type SecurityFormValues = z.infer<typeof securitySchema>;

    const form = useForm<SecurityFormValues>({
        resolver: zodResolver(securitySchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (values: SecurityFormValues) => {
        setIsSaving(true);
        try {
            await usersApi.changePassword({
                currentPassword: values.currentPassword || '',
                password: values.newPassword,
            });
            form.reset();
            toast.success(hasPassword ? t('security.successUpdate') : t('security.successAssign'));
        } catch (error: any) {
            console.error('Error changing password', error);
            const msg = error?.response?.data?.message === 'Invalid current password'
                ? t('security.errorCurrent')
                : (error?.response?.data?.message || t('security.errorUpdate'));
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleGoogleLink = () => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google/link`;
    };

    return (
        <div className="space-y-6">

            {/* ── Contraseña ─────────────────────────────────────── */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5 text-zinc-500" />
                                {hasPassword ? t('security.cardTitleChange') : t('security.cardTitleAssign')}
                            </CardTitle>
                            <CardDescription>
                                {hasPassword
                                    ? t('security.cardDescChange')
                                    : t('security.cardDescAssign')}
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {hasPassword && (
                                    <FormField
                                        control={form.control}
                                        name="currentPassword"
                                        render={({ field }) => (
                                            <FormItem className="sm:col-span-2">
                                                <FormLabel>{t('security.currentLabel')}</FormLabel>
                                                <FormControl>
                                                    <AppInput type="password" placeholder="••••••••" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                <FormField
                                    control={form.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('security.newLabel')}</FormLabel>
                                            <FormControl>
                                                <AppInput type="password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('security.confirmLabel')}</FormLabel>
                                            <FormControl>
                                                <AppInput type="password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>

                        <CardFooter className="justify-between border-t border-border/40 pt-6">
                            <p className="text-xs text-muted-foreground">{t('security.footerNote')}</p>
                            <PrimaryButton compact type="submit" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('security.btnSaving')}
                                    </>
                                ) : (
                                    hasPassword ? t('security.btnChange') : t('security.btnAssign')
                                )}
                            </PrimaryButton>
                        </CardFooter>
                    </Card>
                </form>
            </Form>

            {/* ── Cuentas Vinculadas ─────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-zinc-500" />
                        {t('security.linkedTitle')}
                    </CardTitle>
                    <CardDescription>
                        {t('security.linkedDesc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                                <svg className="h-4 w-4" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    <path d="M1 1h22v22H1z" fill="none" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Google Workspace</p>
                                <p className="text-xs text-muted-foreground">{t('security.googleDesc')}</p>
                            </div>
                        </div>
                        {hasGoogle ? (
                            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {t('security.linkedStatus')}
                            </div>
                        ) : (
                            <Button variant="outline" size="sm" onClick={handleGoogleLink}>
                                {t('security.btnLink')}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}