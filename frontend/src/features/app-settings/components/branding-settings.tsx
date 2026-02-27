"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/common/Label";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, Settings as SettingsIcon } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { AppSettings } from "@/features/app-settings/services/settings-service";
import { getImageUrl } from "@/lib/image-utils";

interface BrandingSettingsProps {
    settings: AppSettings | null;
    primaryColor: string;
    setPrimaryColor: (value: string) => void;
    secondaryColor: string;
    setSecondaryColor: (value: string) => void;
    handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleFaviconUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function BrandingSettings({
    settings,
    primaryColor,
    setPrimaryColor,
    secondaryColor,
    setSecondaryColor,
    handleLogoUpload,
    handleFaviconUpload,
}: BrandingSettingsProps) {
    return (
        <Card className="border-border/60 shadow-sm">
            <CardHeader>
                <CardTitle>Marca</CardTitle>
                <CardDescription>Personaliza los logos y colores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Logo Upload */}
                <div className="space-y-3">
                    <Label>Logo Principal</Label>
                    <div className="flex items-center gap-6 p-4 border border-border/40 dark:border-zinc-700 rounded-lg bg-gray-50/30 dark:bg-zinc-800/30">
                        <div className="h-20 w-20 rounded-lg border border-border dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm overflow-hidden shrink-0 relative">
                            {settings?.appLogo ? (
                                <Image
                                    src={getImageUrl(settings.appLogo) || ''}
                                    alt="App Logo"
                                    fill
                                    className="object-contain p-2"
                                />
                            ) : (
                                <span className="text-2xl font-bold text-muted-foreground/30 dark:text-zinc-600">
                                    LOGO
                                </span>
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                    id="logo-upload"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('logo-upload')?.click()}
                                    leftIcon={<Upload className="h-4 w-4" />}
                                >
                                    Subir Nuevo
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground dark:text-zinc-400">
                                Recomendado: PNG/JPG. Max 5MB. Fondo transparente.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Favicon Upload */}
                <div className="space-y-3">
                    <Label>Favicon</Label>
                    <div className="flex items-center gap-6 p-4 border border-border/40 dark:border-zinc-700 rounded-lg bg-gray-50/30 dark:bg-zinc-800/30">
                        <div className="h-12 w-12 rounded border border-border dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm overflow-hidden shrink-0 relative">
                            {settings?.appFavicon ? (
                                <Image
                                    src={getImageUrl(settings.appFavicon) || ''}
                                    alt="Favicon"
                                    fill
                                    className="object-contain"
                                />
                            ) : (
                                <SettingsIcon className="h-6 w-6 text-muted-foreground/30 dark:text-zinc-600" />
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleFaviconUpload}
                                className="hidden"
                                id="favicon-upload"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('favicon-upload')?.click()}
                                leftIcon={<Upload className="h-4 w-4" />}
                                className="h-8 text-xs"
                            >
                                Subir Favicon
                            </Button>
                            <p className="text-xs text-muted-foreground dark:text-zinc-400">
                                Icono del navegador. 32x32px recomendado.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="primaryColor">Color Primario</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal border-border/60 hover:bg-gray-50"
                                >
                                    <div
                                        className="w-5 h-5 rounded-full border mr-3 shadow-sm"
                                        style={{ backgroundColor: primaryColor }}
                                    />
                                    <span className="flex-1 font-mono text-xs">{primaryColor}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3 shadow-xl">
                                <HexColorPicker color={primaryColor} onChange={setPrimaryColor} />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="secondaryColor">Color Secundario</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal border-border/60 hover:bg-gray-50"
                                >
                                    <div
                                        className="w-5 h-5 rounded-full border mr-3 shadow-sm"
                                        style={{ backgroundColor: secondaryColor }}
                                    />
                                    <span className="flex-1 font-mono text-xs">{secondaryColor}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3 shadow-xl">
                                <HexColorPicker color={secondaryColor} onChange={setSecondaryColor} />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
