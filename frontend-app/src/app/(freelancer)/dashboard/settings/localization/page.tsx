'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { MapPin } from 'lucide-react';
import {
    Card,
    CardContent,
} from '@/components/ui/card';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { LocalizationForm } from './_components/LocalizationForm';
import { Skeleton } from '@/components/ui/skeleton';

export default function LocalizationPage() {
    const { activeWorkspace, checkAuth, isLoading } = useAuth();

    return (
        <DashboardShell>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold tracking-tight">Idioma y Localización</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Configura tu idioma, zona horaria, región y preferencias de formato.
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
