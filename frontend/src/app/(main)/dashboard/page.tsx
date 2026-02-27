"use client";

import { useEffect, useState } from "react";
import api from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderKanban, Activity, TrendingUp, Clock, ArrowUpRight, DollarSign, Wallet, Sparkles } from "lucide-react";

interface User {
    email: string;
    name: string;
    role: string;
}

interface Stats {
    totalUsers?: number;
    totalProjects?: number;
    activeProjects?: number;
}

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<Stats>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userResponse = await api.get("/auth/me");
                setUser(userResponse.data);

                if (userResponse.data.role === "admin") {
                    try {
                        const usersResponse = await api.get("/users");
                        setStats({ totalUsers: usersResponse.data.length });
                    } catch (error) {
                        console.error("Failed to fetch stats:", error);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading || !user) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-100 dark:bg-zinc-800 rounded-lg w-1/3"></div>
                    <div className="h-5 bg-gray-100 dark:bg-zinc-800 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Header Section */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Hola, {user.name.split(' ')[0]} 👋
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Aquí tienes un resumen de la actividad reciente.
                </p>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">

                {/* --- Section 1: Quick Metrics (Portfolio & Assets) --- */}
                {/* Admin Stats */}
                {user.role === "admin" && (
                    <>
                        <Card className="md:col-span-4 border-none shadow-sm bg-gray-50/50 dark:bg-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors rounded-2xl">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Usuarios</CardTitle>
                                <Users className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.totalUsers ?? "—"}</div>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1 font-medium">
                                    <ArrowUpRight className="h-3 w-3" />
                                    +12% vs mes anterior
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="md:col-span-4 border-none shadow-sm bg-gray-50/50 dark:bg-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors rounded-2xl">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Proyectos Activos</CardTitle>
                                <FolderKanban className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.totalProjects ?? "—"}</div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Actualizado hace 1h
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="md:col-span-4 border-none shadow-sm bg-gray-50/50 dark:bg-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors rounded-2xl">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Ingresos Mensuales</CardTitle>
                                <DollarSign className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-zinc-900 dark:text-white">$12,450</div>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1 font-medium">
                                    <ArrowUpRight className="h-3 w-3" />
                                    +8% vs mes anterior
                                </p>
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* Client/Team Stats Placeholder */}
                {user.role !== "admin" && (
                    <>
                        <Card className="md:col-span-6 border-none shadow-sm bg-gray-50/50 dark:bg-zinc-800/50 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Mis Proyectos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-zinc-900 dark:text-white">0 Activos</div>
                            </CardContent>
                        </Card>
                        <Card className="md:col-span-6 border-none shadow-sm bg-gray-50/50 dark:bg-zinc-800/50 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Tareas Pendientes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-zinc-900 dark:text-white">Todo al día 🎉</div>
                            </CardContent>
                        </Card>
                    </>
                )}


                {/* --- Section 2: Banner & Market Details --- */}

                {/* Featured Banner / Promo Area */}
                <div className="md:col-span-8 bg-zinc-900 dark:bg-zinc-950 rounded-3xl p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                        <Activity className="w-64 h-64" />
                    </div>
                    <div className="relative z-10 flex flex-col justify-between h-full min-h-[200px]">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium backdrop-blur-sm mb-4">
                                <Sparkles className="h-3 w-3" />
                                <span>Novedad</span>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold mb-2">Panel de Control 2.0</h3>
                            <p className="text-zinc-400 dark:text-zinc-500 max-w-md">
                                Hemos actualizado la interfaz para mejorar tu flujo de trabajo. Disfruta de la nueva experiencia visual.
                            </p>
                        </div>
                        <button className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors mt-6 w-fit">
                            Explorar características <ArrowUpRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Market / Activity List */}
                <Card className="md:col-span-4 border-gray-100 dark:border-zinc-800 shadow-sm rounded-3xl h-full flex flex-col bg-white dark:bg-zinc-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-white">
                            <Wallet className="h-5 w-5 text-purple-500" />
                            Actividad Reciente
                        </CardTitle>
                        <CardDescription className="text-zinc-500 dark:text-zinc-400">Últimos movimientos</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto pr-2">
                        <div className="space-y-6">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex items-start gap-4 group">
                                    <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                        <TrendingUp className="h-5 w-5 text-gray-500 dark:text-zinc-400 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">Actualización de Sistema</p>
                                            <span className="text-xs text-zinc-400 dark:text-zinc-500">2h</span>
                                        </div>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                            Se ha completado la sincronización automática de los datos del servidor.
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
