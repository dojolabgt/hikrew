"use client";

import { useEffect, useState } from "react";
import { LoginForm } from "@/features/auth/components/login-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getSettings, type AppSettings } from "@/features/app-settings/services/settings-service";
import { AppBranding } from "@/components/common/AppBranding";
import { logger } from "@/lib/logger";

export default function LoginPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [settings, setSettings] = useState<AppSettings | null>(null);

    // Redirect to dashboard if already authenticated
    useEffect(() => {
        if (!isLoading && user) {
            router.replace("/dashboard");
        }
    }, [isLoading, user, router]);

    // Load settings for branding
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await getSettings();
                setSettings(data);
            } catch (error) {
                logger.error("Failed to load settings:", error);
            }
        };
        loadSettings();
    }, []);

    return (
        <div
            className="gradient-bg animate-in fade-in duration-500"
        >
            <div className="w-full min-h-screen lg:grid lg:grid-cols-[45%_55%]">
                {/* Columna Izquierda (Clara) */}
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
                            {/* Logo/Marca */}
                            <AppBranding variant="login" className="justify-center mb-4" />
                            <h1 className="text-2xl font-bold tracking-tight">Acceso Corporativo</h1>
                            <p className="text-sm text-muted-foreground">
                                Selecciona tu tipo de cuenta para continuar.
                            </p>
                        </div>

                        <Tabs defaultValue="user" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="user">Clientes</TabsTrigger>
                                <TabsTrigger value="team">Equipo</TabsTrigger>
                            </TabsList>
                            <TabsContent value="user">
                                <LoginForm role="user" onSuccess={() => router.push("/dashboard")} />
                                <p className="mt-4 text-center text-xs text-muted-foreground">
                                    Acceso para revisión de entregables y gestión de proyectos.
                                </p>
                            </TabsContent>
                            <TabsContent value="team">
                                <LoginForm role="team" onSuccess={() => router.push("/dashboard")} />
                                <p className="mt-4 text-center text-xs text-muted-foreground">
                                    Acceso administrativo y gestión interna.
                                </p>
                            </TabsContent>
                        </Tabs>

                        <div className="text-center text-sm text-muted-foreground mt-6">
                            ¿Necesitas asistencia técnica?{" "}
                            <Link
                                href="/#contact"
                                className="font-medium text-primary hover:underline underline-offset-4"
                            >
                                Soporte IT
                            </Link>
                        </div>

                        {settings?.allowRegistration && (
                            <div className="text-center text-sm text-muted-foreground mt-4">
                                ¿No tienes una cuenta?{" "}
                                <Link
                                    href="/register"
                                    className="font-medium text-primary hover:underline underline-offset-4"
                                >
                                    Regístrate aquí
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna Derecha (Oscura) */}
                <div className="hidden lg:flex flex-col relative bg-zinc-950 text-white overflow-hidden">
                    {/* Fondo decorativo */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
                    <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />

                    {/* Contenido (Top-Left) */}
                    <div className="relative z-10 px-16 pt-24 max-w-2xl">
                        <h2 className="text-5xl font-bold leading-tight tracking-tight mb-6">
                            Colaboración estratégica <br /> y resultados tangibles.
                        </h2>
                        <p className="text-zinc-400 text-lg leading-relaxed max-w-lg">
                            Plataforma de uso exclusivo para la coordinación de proyectos activos. Supervisión en tiempo real de hitos, entregas y aprobaciones.
                        </p>
                    </div>

                    {/* Floating Card (Bottom-Right) */}
                    <div className="absolute bottom-12 right-12 z-20 max-w-sm">
                        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl shadow-2xl transform transition-transform hover:-translate-y-1 duration-300">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-10 w-10 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm">
                                    {process.env.NEXT_PUBLIC_OWNER_INITIALS || "PL"}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{process.env.NEXT_PUBLIC_OWNER_NAME || "Project Director"}</p>
                                    <p className="text-xs text-zinc-400">{process.env.NEXT_PUBLIC_OWNER_TITLE || "Director de Proyecto"}</p>
                                </div>
                            </div>
                            <p className="text-sm text-zinc-300 leading-relaxed">
                                &quot;La claridad en la comunicación es la base del éxito en cada entrega. Bienvenido.&quot;
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
