"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { register } from "@/lib/auth";
import { AppBranding } from "@/components/common/AppBranding";
import { getSettings, type AppSettings } from "@/features/app-settings/services/settings-service";

const registerSchema = z
    .object({
        name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
        email: z.string().email("Correo electrónico inválido"),
        password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [_settings, setSettings] = useState<AppSettings | null>(null);

    // Load settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await getSettings();
                setSettings(data);
            } catch (_error) {
                // Silent fail - settings are optional
            }
        };
        loadSettings();
    }, []);

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(data: RegisterFormValues) {
        setIsLoading(true);
        try {
            await register({
                email: data.email,
                password: data.password,
                name: data.name,
            });
            toast.success("Cuenta creada exitosamente");
            router.push("/dashboard");
        } catch (error) {
            console.error("Registration error:", error);
            const err = error as { response?: { status?: number } };
            if (err.response?.status === 403) {
                toast.error("El registro de nuevos usuarios está deshabilitado.");
            } else {
                toast.error("Error al crear la cuenta. Intente nuevamente.");
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full min-h-screen lg:grid lg:grid-cols-[45%_55%]">
            {/* Left Column */}
            <div className="flex flex-col justify-center items-center bg-background px-4 sm:px-8 relative min-h-screen lg:h-auto">
                <Link
                    href="/"
                    className="absolute left-8 top-8 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Volver
                </Link>

                <div className="w-full max-w-sm space-y-6">
                    <div className="text-center space-y-2">
                        <AppBranding variant="login" className="justify-center mb-4" />
                        <h1 className="text-2xl font-bold tracking-tight">Crear Cuenta</h1>
                        <p className="text-sm text-muted-foreground">
                            Ingresa tus datos para registrarte en la plataforma.
                        </p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre Completo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Juan Pérez" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contraseña</FormLabel>
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
                                {isLoading ? "Creando cuenta..." : "Registrarse"}
                            </Button>
                        </form>
                    </Form>

                    <div className="text-center text-sm text-muted-foreground mt-4">
                        ¿Ya tienes una cuenta?{" "}
                        <Link
                            href="/login"
                            className="font-medium text-primary hover:underline underline-offset-4"
                        >
                            Iniciar Sesión
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right Column (Reuse design from Login) */}
            <div className="hidden lg:flex flex-col relative bg-zinc-950 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
                <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 px-16 pt-24 max-w-2xl">
                    <h2 className="text-5xl font-bold leading-tight tracking-tight mb-6">
                        Únete a nuestro <br /> ecosistema digital.
                    </h2>
                    <p className="text-zinc-400 text-lg leading-relaxed max-w-lg">
                        Gestiona tus proyectos, colabora con el equipo y lleva tus ideas al siguiente nivel.
                    </p>
                </div>
            </div>
        </div>
    );
}