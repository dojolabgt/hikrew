"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getSettings } from "@/features/app-settings/services/settings-service";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Construction } from "lucide-react";

export function MaintenanceCheck() {
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();
    const { user, isLoading: authLoading } = useAuth();

    useEffect(() => {
        const checkMaintenance = async () => {
            try {
                const settings = await getSettings();
                setIsMaintenanceMode(settings.maintenanceMode);
            } catch (error) {
                console.error("Failed to check maintenance mode:", error);
            } finally {
                setLoading(false);
            }
        };

        checkMaintenance();
    }, []);

    // Don't show maintenance page while loading
    if (loading || authLoading) {
        return null;
    }

    // Allow access to login page even in maintenance mode
    // This allows admins to login and disable maintenance mode
    const isLoginPage = pathname === "/login" || pathname === "/";

    // Allow admins to bypass maintenance mode
    const isAdmin = user?.role === "admin";

    // Don't block if:
    // - Not in maintenance mode
    // - On login page
    // - User is admin
    if (!isMaintenanceMode || isLoginPage || isAdmin) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
            <div className="max-w-md w-full mx-4 text-center space-y-6 p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                <div className="flex justify-center">
                    <div className="p-4 bg-orange-500/10 rounded-full">
                        <Construction className="h-12 w-12 text-orange-500" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white">
                        Sitio en Mantenimiento
                    </h1>
                    <p className="text-zinc-400">
                        Estamos realizando mejoras para brindarte una mejor experiencia.
                    </p>
                </div>

                <div className="pt-4 border-t border-white/10">
                    <p className="text-sm text-zinc-500">
                        Volveremos pronto. Gracias por tu paciencia.
                    </p>
                </div>
            </div>
        </div>
    );
}
