'use client';

import { DashboardShell, Surface } from "@/components/layout/DashboardShell";

export default function PaymentsPage() {
    return (
        <div className="flex flex-col h-full">
            <DashboardShell>
                <Surface>
                    <h1 className="text-3xl font-bold tracking-tight mb-4">Pagos</h1>
                    <p className="text-zinc-500">Módulo en construcción...</p>
                </Surface>
            </DashboardShell>
        </div>
    );
}
