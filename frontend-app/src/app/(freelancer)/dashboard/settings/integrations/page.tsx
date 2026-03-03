'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { workspacesApi } from '@/features/workspaces/api';
import { RecurrenteForm } from '../branding/_components/RecurrenteForm';
import { IntegrationCard } from './_components/IntegrationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardShell } from '@/components/layout/DashboardShell';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useAuth } from '@/features/auth/hooks/useAuth';

const recurrenteLogoSrc = '/integrations/recurrente-logo.png';

export default function SettingsPage() {
    const { activeWorkspace } = useAuth();
    const isProOrPremium = activeWorkspace?.plan === 'pro' || activeWorkspace?.plan === 'premium';
    const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sheetOpen, setSheetOpen] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const statusData = await workspacesApi.getRecurrenteStatus();
                setIsConfigured(statusData.configured);
            } catch (error) {
                console.error('Error loading recurrente status', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <DashboardShell>
            <div className="space-y-12 w-full py-2">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-semibold tracking-tight">Integraciones</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Conecta las herramientas que usas para cobrar y gestionar tu negocio.
                    </p>
                </div>

                {/* Cards */}
                <div className="w-full">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary/40 block"></span>
                        Opciones Disponibles
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isLoading ? (
                            <>
                                <Skeleton className="h-[180px] w-full rounded-2xl" />
                                <Skeleton className="h-[180px] w-full rounded-2xl" />
                                <Skeleton className="h-[180px] w-full rounded-2xl" />
                            </>
                        ) : (
                            <>
                                <IntegrationCard
                                    logo={
                                        <Image
                                            src={recurrenteLogoSrc}
                                            alt="Recurrente"
                                            width={44}
                                            height={44}
                                            className="object-contain dark:invert"
                                        />
                                    }
                                    name="Recurrente"
                                    description="Procesador de pagos en Guatemala y El Salvador. Acepta tarjetas, transferencias y links de pago."
                                    isConfigured={isConfigured ?? false}
                                    onConfigure={() => setSheetOpen(true)}
                                    proOnly
                                    userIsPro={isProOrPremium}
                                />
                                <IntegrationCard
                                    logo={
                                        <Image
                                            src="/integrations/drive-logo.png"
                                            alt="Google Drive"
                                            width={44}
                                            height={44}
                                            className="object-contain"
                                        />
                                    }
                                    name="Google Drive"
                                    description="Guarda y organiza tus archivos de proyecto directamente en tu Google Drive de forma automática."
                                    isConfigured={false}
                                    onConfigure={() => { }}
                                    comingSoon
                                    proOnly
                                    userIsPro={isProOrPremium}
                                />
                                <IntegrationCard
                                    logo={
                                        <Image
                                            src="/integrations/rest-api.png"
                                            alt="API Access"
                                            width={44}
                                            height={44}
                                            className="object-contain dark:invert"
                                        />
                                    }
                                    name="Blend API"
                                    description="Conecta aplicaciones personalizadas o automatiza flujos de trabajo utilizando nuestra API REST pública."
                                    isConfigured={false}
                                    onConfigure={() => { }}
                                    comingSoon
                                    proOnly
                                    userIsPro={isProOrPremium}
                                />
                                <IntegrationCard
                                    logo={
                                        <Image
                                            src="/integrations/n8n.png"
                                            alt="n8n"
                                            width={44}
                                            height={44}
                                            className="object-contain"
                                        />
                                    }
                                    name="n8n Templates"
                                    description="Automatiza tareas y sincroniza datos usando nuestros templates preconfigurados para n8n."
                                    isConfigured={false}
                                    onConfigure={() => { }}
                                    comingSoon
                                    proOnly
                                    userIsPro={isProOrPremium}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Sheet for Recurrente config */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="sm:max-w-md overflow-y-auto px-6 py-8 border-l border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#0A0A0A]">
                    <SheetHeader className="mb-8">
                        <div className="flex flex-col gap-4">
                            <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-center p-2.5">
                                <Image
                                    src={recurrenteLogoSrc}
                                    alt="Recurrente"
                                    width={32}
                                    height={32}
                                    className="object-contain dark:invert"
                                />
                            </div>
                            <div>
                                <SheetTitle className="text-xl tracking-tight text-left">Configurar Recurrente</SheetTitle>
                                <SheetDescription className="text-left mt-1.5 leading-relaxed text-zinc-500 dark:text-zinc-400">
                                    Ingresa tus credenciales API de Recurrente para habilitar el procesamiento de pagos.
                                    Tus llaves se guardan encriptadas.
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <RecurrenteForm
                        isConfigured={isConfigured ?? false}
                        onUpdateStatus={(status) => {
                            setIsConfigured(status);
                            if (status) setSheetOpen(false);
                        }}
                    />
                </SheetContent>
            </Sheet>
        </DashboardShell>
    );
}
