'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle } from 'lucide-react';

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

const recurrenteSchema = z.object({
    publicKey: z.string().min(1, 'La llave pública es requerida'),
    privateKey: z.string().min(1, 'La llave privada es requerida'),
});

type RecurrenteFormValues = z.infer<typeof recurrenteSchema>;

interface RecurrenteFormProps {
    isConfigured: boolean;
    onUpdateStatus: (status: boolean) => void;
}

export function RecurrenteForm({ isConfigured, onUpdateStatus }: RecurrenteFormProps) {
    const [isLoading, setIsLoading] = useState(false);

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
            toast.success('Claves de Recurrente guardadas correctamente');
            onUpdateStatus(true);
            form.reset(); // Limpiar el formulario por seguridad
        } catch (error) {
            console.error('Error updating keys:', error);
            toast.error('Ocurrió un error al guardar las claves');
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
                        <AlertTitle>Recurrente Conectado</AlertTitle>
                        <AlertDescription className="text-emerald-800/80">
                            Tus claves han sido configuradas y encriptadas de forma segura.
                            Puedes ingresar nuevas claves si deseas actualizar tu conexión.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert className="bg-amber-50 text-amber-900 border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertTitle>Falta Configuración</AlertTitle>
                        <AlertDescription className="text-amber-800/80">
                            No has configurado tus claves de Recurrente. No podrás cobrar hasta que lo hagas.
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
                                <FormLabel className="text-zinc-700 dark:text-zinc-300">Llave Pública (Public Key)</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="pk_test_..."
                                        className="h-11 rounded-lg"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    Encuentra esta llave en Recurrente {'>'} Desarrolladores {'>'} API Keys.
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
                                <FormLabel className="text-zinc-700 dark:text-zinc-300">Llave Privada (Private / Secret Key)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="sk_test_..."
                                        className="h-11 rounded-lg"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    Esta llave nunca será mostrada de nuevo. Si la pierdes, deberás generar una nueva.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="pt-6 border-t border-border mt-4 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground mr-4">Asegúrate de guardar tus cambios.</p>
                        <PrimaryButton compact type="submit" disabled={isLoading}>
                            {isLoading ? 'Guardando...' : 'Guardar Claves'}
                        </PrimaryButton>
                    </div>
                </form>
            </Form>
        </div>
    );
}
