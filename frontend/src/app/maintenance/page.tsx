"use client";

import { useEffect, useState } from "react";
import { Construction, Clock, Mail } from "lucide-react";
import Image from "next/image";
import { getSettings, type AppSettings } from "@/features/app-settings/services/settings-service";
import { getImageUrl } from "@/lib/image-utils";

export default function MaintenancePage() {
    const [settings, setSettings] = useState<AppSettings | null>(null);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await getSettings();
                setSettings(data);
            } catch (_error) {
                // Silent fail - will use fallback values
            }
        };
        loadSettings();
    }, []);

    const appName = settings?.appName || "Dashboard";
    const appLogo = settings?.appLogo ? getImageUrl(settings.appLogo) : null;
    const primaryColor = settings?.primaryColor || "#abbfe0ff";

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center space-y-8">
                {/* Logo and App Name */}
                <div className="flex flex-col items-center gap-4">
                    {appLogo ? (
                        <div className="relative h-24 w-24 rounded-2xl overflow-hidden shadow-2xl">
                            <Image
                                src={appLogo}
                                alt={appName}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    ) : (
                        <div
                            className="h-24 w-24 rounded-2xl flex items-center justify-center shadow-2xl"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <span className="text-4xl font-bold text-white">
                                {appName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        {appName}
                    </h1>
                </div>

                {/* Maintenance Icon */}
                <div className="flex justify-center">
                    <div
                        className="p-6 rounded-full"
                        style={{ backgroundColor: `${primaryColor}20` }}
                    >
                        <Construction
                            className="h-16 w-16"
                            style={{ color: primaryColor }}
                        />
                    </div>
                </div>

                {/* Main Message */}
                <div className="space-y-4">
                    <h2 className="text-4xl font-bold text-white">
                        Estamos en Mantenimiento
                    </h2>
                    <p className="text-xl text-zinc-400 max-w-lg mx-auto">
                        Estamos trabajando para mejorar tu experiencia.
                        Volveremos pronto.
                    </p>
                </div>

                {/* Additional Info Cards */}
                <div className="grid md:grid-cols-2 gap-4 mt-12">
                    <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6 space-y-3">
                        <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto"
                            style={{ backgroundColor: `${primaryColor}20` }}
                        >
                            <Clock
                                className="h-6 w-6"
                                style={{ color: primaryColor }}
                            />
                        </div>
                        <h3 className="font-semibold text-white">Tiempo Estimado</h3>
                        <p className="text-sm text-zinc-400">
                            Estaremos de vuelta en breve. Gracias por tu paciencia.
                        </p>
                    </div>

                    <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6 space-y-3">
                        <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto"
                            style={{ backgroundColor: `${primaryColor}20` }}
                        >
                            <Mail
                                className="h-6 w-6"
                                style={{ color: primaryColor }}
                            />
                        </div>
                        <h3 className="font-semibold text-white">¿Necesitas Ayuda?</h3>
                        <p className="text-sm text-zinc-400">
                            Si tienes alguna urgencia, contáctanos directamente.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-8 text-sm text-zinc-500">
                    <p>© {new Date().getFullYear()} {appName}. Todos los derechos reservados.</p>
                </div>
            </div>
        </div>
    );
}