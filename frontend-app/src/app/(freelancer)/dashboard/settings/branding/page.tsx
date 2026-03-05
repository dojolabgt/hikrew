'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProfileForm } from './_components/ProfileForm';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';

export default function ProfilePage() {
    const { activeWorkspace, checkAuth, isLoading } = useAuth();
    const { t } = useWorkspaceSettings();

    return (
        <DashboardShell>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold tracking-tight">{t('branding.title')}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    {t('branding.desc')}
                </p>
            </div>

            <div className="max-w-3xl">
                {isLoading ? (
                    <Skeleton className="h-[420px] w-full rounded-xl" />
                ) : (
                    <ProfileForm
                        initialData={activeWorkspace}
                        onUpdate={() => {
                            checkAuth(); // Refetch context to update Sidebar
                        }}
                    />
                )}
            </div>
        </DashboardShell>
    );
}

