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
        <div className={`flex items-center gap-5 p-5 rounded-xl border bg-white dark:bg-zinc-900 transition-shadow ${comingSoon ? 'opacity-60' : 'hover:shadow-md'
            }`}>
            {/* Logo */}
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-zinc-50 dark:bg-zinc-800 border flex items-center justify-center overflow-hidden p-2">
                {logo}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{name}</span>
                    {comingSoon ? (
                        <Badge className="bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 text-xs font-medium px-2 py-0.5">
                            Próximamente
                        </Badge>
                    ) : isConfigured ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1 text-xs font-medium px-2 py-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Conectado
                        </Badge>
                    ) : (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 gap-1 text-xs font-medium px-2 py-0.5">
                            <AlertCircle className="w-3 h-3" />
                            No configurado
                        </Badge>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{description}</p>
            </div>

            {/* Action */}
            <Button
                variant="outline"
                size="sm"
                onClick={onConfigure}
                disabled={comingSoon}
                className="flex-shrink-0 gap-1"
            >
                {isConfigured ? 'Actualizar' : 'Configurar'}
                <ChevronRight className="w-4 h-4" />
            </Button>
        </div>
    );
}
