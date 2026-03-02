'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProfileForm } from './_components/ProfileForm';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardShell } from '@/components/layout/DashboardShell';

export default function ProfilePage() {
    const { activeWorkspace, checkAuth, isLoading } = useAuth();

    return (
        <DashboardShell>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold tracking-tight">Mi Espacio</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Configura la identidad visual de tu negocio.
                </p>
            </div>

            {/* Content — constrained width for form pages */}
            <div className="max-w-2xl">
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

