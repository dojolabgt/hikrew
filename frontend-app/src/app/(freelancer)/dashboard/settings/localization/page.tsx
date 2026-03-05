'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { LocalizationForm } from './_components/LocalizationForm';
import { Skeleton } from '@/components/ui/skeleton';

export default function LocalizationPage() {
    const { activeWorkspace, checkAuth, isLoading } = useAuth();
    const { t } = useWorkspaceSettings();

    return (
        <DashboardShell>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold tracking-tight">{t('localization.title')}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    {t('localization.desc')}
                </p>
            </div>

            <div className="space-y-6 max-w-4xl">
                {isLoading ? (
                    <Skeleton className="h-[600px] w-full rounded-xl" />
                ) : (
                    <LocalizationForm
                        initialData={activeWorkspace}
                        onUpdate={() => {
                            checkAuth(); // Refetch context to update layout if needed
                        }}
                    />
                )}
            </div>
        </DashboardShell>
    );
}
