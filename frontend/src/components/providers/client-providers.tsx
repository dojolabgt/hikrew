"use client";

import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { MaintenanceCheck } from "@/components/common/maintenance-check";
import { AuthProvider } from "@/features/auth/context/auth-context";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { getSettings, type AppSettings } from "@/features/app-settings/services/settings-service";
import { getImageUrl } from "@/lib/image-utils";

export function ClientProviders({
    children,
}: {
    children: React.ReactNode;
}) {
    const [settings, setSettings] = useState<AppSettings | null>(null);

    // Load settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await getSettings();
                setSettings(data);
            } catch (error) {
                console.error("Failed to load settings:", error);
            }
        };

        loadSettings();

        // Poll for settings changes every 30 seconds
        const interval = setInterval(loadSettings, 30000);
        return () => clearInterval(interval);
    }, []);

    // Update page title and favicon when settings change
    useEffect(() => {
        if (!settings) return;

        // Update page title
        if (typeof document !== "undefined") {
            document.title = settings.appName || "Dashboard App";

            // Update favicon
            if (settings.appFavicon) {
                const faviconUrl = getImageUrl(settings.appFavicon);

                // Find existing favicon or create new one
                let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;

                if (!favicon) {
                    favicon = document.createElement("link");
                    favicon.rel = "icon";
                    document.head.appendChild(favicon);
                }

                // Update href with cache busting
                if (faviconUrl) {
                    favicon.href = `${faviconUrl}?t=${Date.now()}`;
                }
            }
        }
    }, [settings]);

    return (
        <ErrorBoundary>
            <AuthProvider>
                <MaintenanceCheck />
                {children}
                <Toaster position="top-left" richColors />
            </AuthProvider>
        </ErrorBoundary>
    );
}
