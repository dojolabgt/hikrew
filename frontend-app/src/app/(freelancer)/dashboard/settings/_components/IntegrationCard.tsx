'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';

interface IntegrationCardProps {
    logo: React.ReactNode;
    name: string;
    description: string;
    isConfigured: boolean;
    onConfigure: () => void;
    comingSoon?: boolean;
}

export function IntegrationCard({
    logo,
    name,
    description,
    isConfigured,
    onConfigure,
    comingSoon = false,
}: IntegrationCardProps) {
    return (
        <div className={`flex flex-col p-6 rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300 ${comingSoon ? 'opacity-70 grayscale-[0.2]' : 'hover:shadow-md hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>

            <div className="flex items-start justify-between mb-5">
                {/* Logo */}
                <div className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border flex items-center justify-center overflow-hidden p-3 shadow-inner transition-transform group-hover:scale-105">
                    {logo}
                </div>

                {/* Status Badge */}
                <div>
                    {comingSoon ? (
                        <Badge className="bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] font-semibold px-2.5 py-1 uppercase tracking-wider">
                            Beta
                        </Badge>
                    ) : isConfigured ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/30 gap-1.5 text-xs font-medium px-2.5 py-1 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Conectado
                        </Badge>
                    ) : (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30 gap-1.5 text-xs font-medium px-2.5 py-1 shadow-sm">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Inactivo
                        </Badge>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 mb-6">
                <h3 className="font-bold text-lg mb-1.5 text-zinc-900 dark:text-zinc-100 tracking-tight">{name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{description}</p>
            </div>

            {/* Action */}
            <div className="mt-auto pt-4 border-t border-border/50">
                <Button
                    variant={isConfigured ? 'outline' : comingSoon ? 'secondary' : 'default'}
                    className={`w-full gap-2 transition-all active:scale-[0.98] ${!isConfigured && !comingSoon ? 'shadow-sm' : ''}`}
                    onClick={onConfigure}
                    disabled={comingSoon}
                >
                    {comingSoon ? 'No disponible aún' : isConfigured ? 'Configuración' : 'Conectar cuenta'}
                    {!comingSoon && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Button>
            </div>
        </div>
    );
}
