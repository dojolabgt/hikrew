'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { freelancerProfileApi } from '@/features/freelancer-profile/api';
import { RecurrenteForm } from '../profile/_components/RecurrenteForm';
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

const recurrenteLogoSrc = '/integrations/recurrente-logo.png';

export default function SettingsPage() {
    const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sheetOpen, setSheetOpen] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const statusData = await freelancerProfileApi.getRecurrenteStatus();
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
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Integraciones</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Conecta las herramientas que usas para cobrar y gestionar tu negocio.
                    </p>
                </div>

                {/* Cards */}
                <div className="max-w-2xl space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                        Pagos
                    </p>

                    {isLoading ? (
                        <>
                            <Skeleton className="h-24 w-full rounded-xl" />
                            <Skeleton className="h-24 w-full rounded-xl" />
                        </>
                    ) : (
                        <>
                            <IntegrationCard
                                logo={
                                    <Image
                                        src={recurrenteLogoSrc}
                                        alt="Recurrente"
                                        width={40}
                                        height={40}
                                        className="object-contain dark:invert"
                                    />
                                }
                                name="Recurrente"
                                description="Procesador de pagos en Guatemala y El Salvador. Acepta tarjetas, transferencias y links de pago."
                                isConfigured={isConfigured ?? false}
                                onConfigure={() => setSheetOpen(true)}
                            />
                            <IntegrationCard
                                logo={
                                    <Image
                                        src="/integrations/drive-logo.png"
                                        alt="Google Drive"
                                        width={40}
                                        height={40}
                                        className="object-contain"
                                    />
                                }
                                name="Google Drive"
                                description="Guarda y organiza tus archivos de proyecto directamente en tu Google Drive."
                                isConfigured={false}
                                onConfigure={() => { }}
                                comingSoon
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Sheet for Recurrente config */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="sm:max-w-lg overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 border flex items-center justify-center p-1.5">
                                <Image
                                    src={recurrenteLogoSrc}
                                    alt="Recurrente"
                                    width={24}
                                    height={24}
                                    className="object-contain dark:invert"
                                />
                            </div>
                            <SheetTitle>Configurar Recurrente</SheetTitle>
                        </div>
                        <SheetDescription>
                            Ingresa tus API Keys de Recurrente para habilitar el procesamiento de pagos.
                            Las claves se encriptan antes de guardarse.
                        </SheetDescription>
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
