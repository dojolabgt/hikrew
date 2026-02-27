"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/common/Label";
import { Switch } from "@/components/ui/switch";

interface FeatureSettingsProps {
    allowRegistration: boolean;
    setAllowRegistration: (value: boolean) => void;
    maintenanceMode: boolean;
    setMaintenanceMode: (value: boolean) => void;
}

export function FeatureSettings({
    allowRegistration,
    setAllowRegistration,
    maintenanceMode,
    setMaintenanceMode,
}: FeatureSettingsProps) {
    return (
        <Card className="border-border/60 shadow-sm">
            <CardHeader>
                <CardTitle>Funcionalidades</CardTitle>
                <CardDescription>Control de acceso y características</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Allow Registration */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50/50 dark:bg-zinc-800/30 border border-border/40 dark:border-zinc-700">
                    <div className="space-y-0.5">
                        <Label htmlFor="allowRegistration" className="text-base font-medium text-zinc-900 dark:text-white">Registro de Usuarios</Label>
                        <p className="text-sm text-muted-foreground dark:text-zinc-400">
                            Permitir que nuevos usuarios se registren libremente en la plataforma.
                        </p>
                    </div>
                    <Switch
                        id="allowRegistration"
                        checked={allowRegistration}
                        onCheckedChange={setAllowRegistration}
                    />
                </div>

                {/* Maintenance Mode */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50/50 dark:bg-zinc-800/30 border border-border/40 dark:border-zinc-700">
                    <div className="space-y-0.5">
                        <Label htmlFor="maintenanceMode" className="text-base font-medium text-zinc-900 dark:text-white">Modo Mantenimiento</Label>
                        <p className="text-sm text-muted-foreground dark:text-zinc-400">
                            Bloquea el acceso a usuarios no administradores y muestra una página de mantenimiento.
                        </p>
                    </div>
                    <Switch
                        id="maintenanceMode"
                        checked={maintenanceMode}
                        onCheckedChange={setMaintenanceMode}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
