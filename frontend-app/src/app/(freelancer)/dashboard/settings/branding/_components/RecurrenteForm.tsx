'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PrimaryButton } from '@/components/common/PrimaryButton';

interface RecurrenteFormProps {
    isConfigured: boolean;
    onUpdateStatus: (status: boolean) => void;
}

export function RecurrenteForm({ isConfigured, onUpdateStatus }: RecurrenteFormProps) {
    const { t } = useWorkspaceSettings();
    const [isLoading, setIsLoading] = useState(false);

    const recurrenteSchema = z.object({
        publicKey: z.string().min(1, t('recurrente.publicKeyRequired')),
        privateKey: z.string().min(1, t('recurrente.privateKeyRequired')),
    });

    type RecurrenteFormValues = z.infer<typeof recurrenteSchema>;

    const form = useForm<RecurrenteFormValues>({
        resolver: zodResolver(recurrenteSchema),
        defaultValues: {
            publicKey: '',
            privateKey: '',
        },
    });

    async function onSubmit(data: RecurrenteFormValues) {
        setIsLoading(true);
        try {
            await workspacesApi.updateRecurrenteKeys(data);
            toast.success(t('recurrente.successMsg'));
            onUpdateStatus(true);
            form.reset(); // Limpiar el formulario por seguridad
        } catch (error) {
            console.error('Error updating keys:', error);
            toast.error(t('recurrente.errorMsg'));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6 pt-2">
            <div>
                {isConfigured ? (
                    <Alert className="bg-emerald-50 text-emerald-900 border-emerald-200">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <AlertTitle>{t('recurrente.connected')}</AlertTitle>
                        <AlertDescription className="text-emerald-800/80">
                            {t('recurrente.connectedDesc')}
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert className="bg-amber-50 text-amber-900 border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertTitle>{t('recurrente.missingConfig')}</AlertTitle>
                        <AlertDescription className="text-amber-800/80">
                            {t('recurrente.missingConfigDesc')}
                        </AlertDescription>
                    </Alert>
                )}
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                        control={form.control}
                        name="publicKey"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-zinc-700 dark:text-zinc-300">{t('recurrente.publicKeyLabel')}</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder={t('recurrente.publicKeyPlaceholder')}
                                        className="h-11 rounded-lg"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    {t('recurrente.publicKeyHelp')}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="privateKey"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-zinc-700 dark:text-zinc-300">{t('recurrente.privateKeyLabel')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder={t('recurrente.privateKeyPlaceholder')}
                                        className="h-11 rounded-lg"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    {t('recurrente.privateKeyHelp')}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="pt-6 border-t border-border mt-4 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground mr-4">{t('recurrente.saveReminder')}</p>
                        <PrimaryButton compact type="submit" disabled={isLoading}>
                            {isLoading ? t('recurrente.saving') : t('recurrente.saveBtn')}
                        </PrimaryButton>
                    </div>
                </form>
            </Form>
        </div>
    );
}
