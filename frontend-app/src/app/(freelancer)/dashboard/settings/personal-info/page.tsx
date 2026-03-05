'use client';

import { AccountDetailsForm } from './_components/AccountDetailsForm';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';

export default function AccountPage() {
    const { t } = useWorkspaceSettings();

    return (
        <DashboardShell>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold tracking-tight">{t('personalInfo.title')}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    {t('personalInfo.desc')}
                </p>
            </div>

            <div className="max-w-3xl">
                <AccountDetailsForm />
            </div>
        </DashboardShell>
    );
}
