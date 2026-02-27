"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/common/Label";
import { Input } from "@/components/common/Input";

interface GeneralSettingsProps {
    appName: string;
    setAppName: (value: string) => void;
}

export function GeneralSettings({ appName, setAppName }: GeneralSettingsProps) {
    return (
        <Card className="border-border/60 shadow-sm">
            <CardHeader>
                <CardTitle>General</CardTitle>
                <CardDescription>Información básica de la aplicación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="appName">Nombre de la Aplicación</Label>
                    <Input
                        id="appName"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="Mi Dashboard"
                        maxLength={100}
                        className="bg-gray-50/50 focus:bg-white transition-all"
                    />
                    <p className="text-xs text-muted-foreground">
                        Este nombre aparecerá en el título de la pestaña del navegador y en el footer.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
