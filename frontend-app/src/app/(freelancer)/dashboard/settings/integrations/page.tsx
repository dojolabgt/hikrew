'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { workspacesApi } from '@/features/workspaces/api';
import { RecurrenteForm } from '../branding/_components/RecurrenteForm';
import { IntegrationCard } from './_components/IntegrationCard';
import { GoogleDriveSheet } from './_components/GoogleDriveSheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';
import { Gt, Sv } from '@next-languages/flags';

const recurrenteLogoSrc = '/integrations/recurrente-logo.png';

// Reads ?drive=connected from the URL and fires a toast once
function DriveConnectedNotifier({ onNotify }: { onNotify: () => void }) {
    const searchParams = useSearchParams();
    useEffect(() => {
        if (searchParams.get('drive') === 'connected') {
            onNotify();
            // Clean the URL without reloading
            const url = new URL(window.location.href);
            url.searchParams.delete('drive');
            window.history.replaceState({}, '', url.toString());
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return null;
}

export default function IntegrationsPage() {
    const { t } = useWorkspaceSettings();
    const { activeWorkspace } = useAuth();
    const isProOrPremium = activeWorkspace?.plan === 'pro' || activeWorkspace?.plan === 'premium';
    const workspaceCountry = activeWorkspace?.country || 'GT';
    const isRecurrenteSupported = workspaceCountry === 'GT' || workspaceCountry === 'SV';

    // Recurrente
    const [isRecurrenteConfigured, setIsRecurrenteConfigured] = useState<boolean | null>(null);
    const [recurrenteSheetOpen, setRecurrenteSheetOpen] = useState(false);

    // Google Drive
    const [driveConnected, setDriveConnected] = useState<boolean>(false);
    const [driveEmail, setDriveEmail] = useState<string | undefined>(undefined);
    const [driveSheetOpen, setDriveSheetOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [recurrente, drive] = await Promise.allSettled([
                    workspacesApi.getRecurrenteStatus(),
                    workspacesApi.getGoogleDriveStatus(),
                ]);
                if (recurrente.status === 'fulfilled') setIsRecurrenteConfigured(recurrente.value.configured);
                if (drive.status === 'fulfilled') {
                    setDriveConnected(drive.value.connected);
                    setDriveEmail(drive.value.email);
                }
            } catch (error) {
                console.error('Error loading integrations status', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const handleDriveNotify = () => {
        setDriveConnected(true);
        // Re-fetch to get email, then auto-open the config sheet
        workspacesApi.getGoogleDriveStatus()
            .then(s => { setDriveConnected(s.connected); setDriveEmail(s.email); })
            .catch(() => {});
        toast.success(t('integrations.driveConnectSuccess'));
        setDriveSheetOpen(true);
    };

    return (
        <div className="px-6 py-6">
            <Suspense fallback={null}>
                <DriveConnectedNotifier onNotify={handleDriveNotify} />
            </Suspense>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-tight">
                    {t('integrations.title')}
                </h1>
                <p className="text-[13px] text-gray-500 dark:text-white/50 mt-0.5 leading-snug">
                    {t('integrations.titleDesc')}
                </p>
            </div>

            {/* Section label */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-white/20 shrink-0" />
                {t('integrations.availableOptions')}
            </p>

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <>
                        <Skeleton className="h-[200px] w-full rounded-2xl dark:bg-white/[0.05]" />
                        <Skeleton className="h-[200px] w-full rounded-2xl dark:bg-white/[0.05]" />
                        <Skeleton className="h-[200px] w-full rounded-2xl dark:bg-white/[0.05]" />
                        <Skeleton className="h-[200px] w-full rounded-2xl dark:bg-white/[0.05]" />
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
                            description={t('integrations.recurrenteDesc')}
                            isConfigured={isRecurrenteConfigured ?? false}
                            onConfigure={() => setRecurrenteSheetOpen(true)}
                            proOnly
                            userIsPro={isProOrPremium}
                            badges={[
                                <div key="gt" className="w-5 rounded-[3px] overflow-hidden border border-gray-200 dark:border-white/[0.1]">
                                    <Gt className="w-full h-auto" />
                                </div>,
                                <div key="sv" className="w-5 rounded-[3px] overflow-hidden border border-gray-200 dark:border-white/[0.1]">
                                    <Sv className="w-full h-auto" />
                                </div>,
                            ]}
                            disabledReason={!isRecurrenteSupported ? t('integrations.notSupportedCountry') : undefined}
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
                            description={t('integrations.driveDesc')}
                            isConfigured={driveConnected}
                            onConfigure={() => setDriveSheetOpen(true)}
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
                            name="Krew API"
                            description={t('integrations.apiDesc')}
                            isConfigured={false}
                            onConfigure={() => {}}
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
                            description={t('integrations.n8nDesc')}
                            isConfigured={false}
                            onConfigure={() => {}}
                            comingSoon
                            proOnly
                            userIsPro={isProOrPremium}
                        />
                    </>
                )}
            </div>

            {/* Sheet: Recurrente config */}
            <Sheet open={recurrenteSheetOpen} onOpenChange={setRecurrenteSheetOpen}>
                <SheetContent className="sm:max-w-md overflow-y-auto border-l border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#111111]">
                    <SheetHeader className="px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/[0.06]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/[0.06] border border-gray-100 dark:border-white/[0.08] flex items-center justify-center p-2">
                                <Image
                                    src={recurrenteLogoSrc}
                                    alt="Recurrente"
                                    width={28}
                                    height={28}
                                    className="object-contain dark:invert"
                                />
                            </div>
                            <div>
                                <SheetTitle className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight text-left">
                                    {t('integrations.configRecurrente')}
                                </SheetTitle>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-white/40 mt-0.5">
                                    Recurrente · Pagos recurrentes
                                </p>
                            </div>
                        </div>
                        <SheetDescription className="text-[13px] text-gray-500 dark:text-white/50 leading-relaxed text-left">
                            {t('integrations.configRecurrenteDesc')}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="px-6 py-5">
                        <RecurrenteForm
                            isConfigured={isRecurrenteConfigured ?? false}
                            onUpdateStatus={(status) => {
                                setIsRecurrenteConfigured(status);
                                if (status) setRecurrenteSheetOpen(false);
                            }}
                        />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Sheet: Google Drive config */}
            <GoogleDriveSheet
                open={driveSheetOpen}
                onOpenChange={setDriveSheetOpen}
                onStatusChange={(connected, email) => {
                    setDriveConnected(connected);
                    setDriveEmail(email);
                }}
            />
        </div>
    );
}
