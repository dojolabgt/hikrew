'use client';

import { Surface } from "@/components/layout/DashboardShell";

export default function AdminDashboardPage() {
    return (
        <div className="p-8">
            <Surface>
                <h1 className="text-3xl font-bold tracking-tight mb-4">Admin Dashboard</h1>
                <p className="text-zinc-500">Bienvenido al panel de administración.</p>
            </Surface>
        </div>
    );
}
