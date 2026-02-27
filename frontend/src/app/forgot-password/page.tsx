"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
import { forgotPassword } from "@/lib/auth";
import { AppBranding } from "@/components/common/AppBranding";

const forgotPasswordSchema = z.object({
    email: z.string().email("Correo electrónico inválido"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    async function onSubmit(data: ForgotPasswordFormValues) {
        setIsLoading(true);
        try {
            await forgotPassword(data.email);
            setIsSubmitted(true);
            toast.success("Correo enviado");
        } catch (error) {
            console.error("Forgot password error:", error);
            toast.error("Error al enviar la solicitud. Intente nuevamente.");
        } finally {
            setIsLoading(false);
        }
    }

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
                        <h1 className="text-2xl font-bold tracking-tight">Recuperar Contraseña</h1>
                        <p className="text-sm text-muted-foreground">
                            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                        </p>
                    </div>

                    {isSubmitted ? (
                        <div className="text-center space-y-4">
                            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-lg text-sm">
                                Si existe una cuenta asociada a ese correo, recibirás un enlace
                                para restablecer tu contraseña en breve.
                            </div>
                            <Button asChild className="w-full" variant="outline">
                                <Link href="/login">Volver al inicio de sesión</Link>
                            </Button>
                        </div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="correo@ejemplo.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Enviando..." : "Enviar enlace"}
                                </Button>
                            </form>
                        </Form>
                    )}
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
