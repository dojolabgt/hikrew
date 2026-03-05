'use client';

import { SecurityForm } from './SecurityForm';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';
import { ShieldAlert, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export default function SecurityPage() {
    const { t } = useWorkspaceSettings();

    return (
        <DashboardShell>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold tracking-tight">{t('security.title')}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    {t('security.desc')}
                </p>
            </div>

            {/* Content — constrained width for form pages */}
            <div className="space-y-6 max-w-3xl">
                <SecurityForm />

                {/* 2FA Placeholder Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-primary" />
                            {t('security.2faTitle')}
                        </CardTitle>
                        <CardDescription>
                            {t('security.2faDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 mb-5">
                            <Smartphone className="w-5 h-5 text-zinc-400" />
                            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                                {t('security.2faApp')}
                            </span>
                        </div>
                        <Button variant="outline" disabled>
                            {t('security.2faBtn')}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    );
}
