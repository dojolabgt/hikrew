"use client";

import { useState, useEffect } from "react";
import { Loader2, Palette, LayoutDashboard, Component } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils";
import {
    getSettings,
    updateSettings,
    uploadLogo,
    uploadFavicon,
    type AppSettings,
} from "@/features/app-settings/services/settings-service";

import { GeneralSettings } from "@/features/app-settings/components/general-settings";
import { BrandingSettings } from "@/features/app-settings/components/branding-settings";
import { FeatureSettings } from "@/features/app-settings/components/feature-settings";

type SettingsTab = "general" | "branding" | "features";

export default function AppSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [activeTab, setActiveTab] = useState<SettingsTab>("general");

    // Form state
    const [appName, setAppName] = useState("");
    const [primaryColor, setPrimaryColor] = useState("#3B82F6");
    const [secondaryColor, setSecondaryColor] = useState("#10B981");
    const [allowRegistration, setAllowRegistration] = useState(true);
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    // Load settings
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await getSettings();
            setSettings(data);
            setAppName(data.appName);
            setPrimaryColor(data.primaryColor);
            setSecondaryColor(data.secondaryColor);
            setAllowRegistration(data.allowRegistration);
            setMaintenanceMode(data.maintenanceMode);
        } catch (_error) {
            toast.error("Error al cargar la configuración");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updated = await updateSettings({
                appName,
                primaryColor,
                secondaryColor,
                allowRegistration,
                maintenanceMode,
            });
            setSettings(updated);
            toast.success("Configuración actualizada correctamente");
        } catch (_error) {
            toast.error("Error al actualizar la configuración");
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("El tamaño de la imagen debe ser menor a 5MB");
            return;
        }

        try {
            const updated = await uploadLogo(file);
            setSettings(updated);
            toast.success("Logo subido correctamente");
        } catch (_error) {
            toast.error("Error al subir el logo");
        }
    };

    const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        if (file.size > 1 * 1024 * 1024) {
            toast.error("El tamaño del favicon debe ser menor a 1MB");
            return;
        }

        try {
            const updated = await uploadFavicon(file);
            setSettings(updated);
            toast.success("Favicon subido correctamente");
        } catch (_error) {
            toast.error("Error al subir el favicon");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const menuItems = [
        { id: "general", label: "General", icon: LayoutDashboard },
        { id: "branding", label: "Marca", icon: Palette },
        { id: "features", label: "Funcionalidades", icon: Component },
    ] as const;

    return (
        <div className="flex flex-col gap-6 h-full">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Configuración de la Aplicación</h1>
                <p className="text-muted-foreground dark:text-zinc-400 mt-2">
                    Personaliza la apariencia y comportamiento de tu aplicación
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* Sidebar Navigation */}
                <aside className="w-full lg:w-64 shrink-0">
                    <nav className="flex flex-col space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as SettingsTab)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors text-left",
                                        activeTab === item.id
                                            ? "bg-primary/10 text-primary border border-primary/20"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Content Area */}
                <main className="flex-1 w-full space-y-6">

                    {/* General Settings */}
                    {activeTab === "general" && (
                        <GeneralSettings
                            appName={appName}
                            setAppName={setAppName}
                        />
                    )}

                    {/* Branding Settings */}
                    {activeTab === "branding" && (
                        <BrandingSettings
                            settings={settings}
                            primaryColor={primaryColor}
                            setPrimaryColor={setPrimaryColor}
                            secondaryColor={secondaryColor}
                            setSecondaryColor={setSecondaryColor}
                            handleLogoUpload={handleLogoUpload}
                            handleFaviconUpload={handleFaviconUpload}
                        />
                    )}

                    {/* Features Settings */}
                    {activeTab === "features" && (
                        <FeatureSettings
                            allowRegistration={allowRegistration}
                            setAllowRegistration={setAllowRegistration}
                            maintenanceMode={maintenanceMode}
                            setMaintenanceMode={setMaintenanceMode}
                        />
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t border-border/40">
                        <Button onClick={handleSave} disabled={saving} size="lg" className="min-w-[150px]">
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                "Guardar Cambios"
                            )}
                        </Button>
                    </div>

                </main>
            </div>
        </div>
    );
}