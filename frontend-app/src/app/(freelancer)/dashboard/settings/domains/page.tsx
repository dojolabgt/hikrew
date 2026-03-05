'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { Globe } from 'lucide-react';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';

export default function DomainsPage() {
    const { t } = useWorkspaceSettings();
    return (
        <DashboardShell>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold tracking-tight">{t('domains.title')}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    {t('domains.titleDesc')}
                </p>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                            <Globe className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{t('domains.domainsWhiteLabel')}</h2>
                        <h3 className="text-lg font-medium text-primary mb-4">{t('domains.comingSoon')}</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            {t('domains.comingSoonDesc')}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    );
}
