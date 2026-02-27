"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { resetPassword } from "@/lib/auth";
import { AppBranding } from "@/components/common/AppBranding";

const resetPasswordSchema = z
    .object({
        password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(data: ResetPasswordFormValues) {
        if (!token) {
            toast.error("Token no válido o faltante.");
            return;
        }

        setIsLoading(true);
        try {
            await resetPassword(token, data.password);
            toast.success("Contraseña actualizada exitosamente");
            router.push("/login");
        } catch (error) {
            console.error("Reset password error:", error);
            toast.error("Error al restablecer la contraseña. El enlace puede haber expirado.");
        } finally {
            setIsLoading(false);
        }
    }

    if (!token) {
        return (
            <div className="text-center space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg text-sm">
                    Enlace no válido. Verifica que hayas copiado el enlace completo desde tu correo.
                </div>
                <Button asChild className="w-full" variant="outline">
                    <Link href="/login">Volver al inicio de sesión</Link>
                </Button>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nueva Contraseña</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="******" {...field} />
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
                            <FormLabel>Confirmar Contraseña</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="******" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Restableciendo..." : "Restablecer contraseña"}
                </Button>
            </form>
        </Form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="w-full min-h-screen lg:grid lg:grid-cols-[45%_55%]">
            {/* Left Column */}
            <div className="flex flex-col justify-center items-center bg-background px-4 sm:px-8 relative min-h-screen lg:h-auto">
                <Link
                    href="/login"
                    className="absolute left-8 top-8 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Volver
                </Link>

                <div className="w-full max-w-sm space-y-6">
                    <div className="text-center space-y-2">
                        <AppBranding variant="login" className="justify-center mb-4" />
                        <h1 className="text-2xl font-bold tracking-tight">Restablecer Contraseña</h1>
                        <p className="text-sm text-muted-foreground">
                            Ingresa una nueva contraseña para tu cuenta.
                        </p>
                    </div>

                    <Suspense fallback={<div>Cargando...</div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </div>

            {/* Right Column */}
            <div className="hidden lg:flex flex-col relative bg-zinc-950 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
                <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 px-16 pt-24 max-w-2xl">
                    <h2 className="text-5xl font-bold leading-tight tracking-tight mb-6">
                        Seguridad y control <br /> en tus manos.
                    </h2>
                    <p className="text-zinc-400 text-lg leading-relaxed max-w-lg">
                        Recupera el acceso a tu cuenta de forma segura y continúa gestionando tus proyectos sin interrupciones.
                    </p>
                </div>
            </div>
        </div>
    );
}
