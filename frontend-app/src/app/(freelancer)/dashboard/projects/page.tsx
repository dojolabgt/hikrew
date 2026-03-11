'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FolderKanban } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useProjects } from '@/hooks/use-projects';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DataTable, ColumnDef } from '@/components/common/DataTable';

const STATUS_STYLES: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400',
    COMPLETED: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500',
};

const STATUS_LABEL: Record<string, string> = {
    ACTIVE: 'Activo',
    COMPLETED: 'Completado',
};

function StatusBadge({ status }: { status: string }) {
    const key = status?.toUpperCase() ?? 'ACTIVE';
    return (
        <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${STATUS_STYLES[key] ?? STATUS_STYLES.ACTIVE}`}>
            {STATUS_LABEL[key] ?? status}
        </span>
    );
}

export default function ProjectsPage() {
    const { activeWorkspace } = useAuth();
    const { projects, fetchProjects, isLoading } = useProjects();
    const router = useRouter();

    useEffect(() => {
        if (activeWorkspace) {
            fetchProjects();
        }
    }, [activeWorkspace, fetchProjects]);

    interface ProjectItem {
        id: string;
        name: string;
        status: string;
        workspace?: { id: string; name?: string; businessName?: string };
        deal?: { client?: { name?: string } };
        collaborators?: unknown[];
        createdAt: string;
        [key: string]: unknown;
    }

    const getClientName = (project: ProjectItem) => project.deal?.client?.name ?? '—';

    const columns: ColumnDef<ProjectItem>[] = [
        {
            key: 'name',
            header: 'Proyecto',
            render: (project) => {
                const isShared = project.workspace?.id !== activeWorkspace?.id;
                return (
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="font-semibold group-hover:text-primary transition-colors">
                                {project.name || '(sin nombre)'}
                            </div>
                            {isShared && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                    De: {project.workspace?.businessName || project.workspace?.name || 'Otro'}
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {getClientName(project)}
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'status',
            header: 'Estado',
            render: (project) => <StatusBadge status={project.status ?? 'ACTIVE'} />,
        },
        {
            key: 'collaborators',
            header: 'Colaboradores',
            render: (project) => (
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {project.collaborators?.length || 0}
                </span>
            ),
        },
        {
            key: 'createdAt',
            header: 'Creado',
            render: (project) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(project.createdAt).toLocaleDateString('es-GT')}
                </span>
            ),
        },
    ];

    return (
        <DashboardShell>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona la ejecución de tus tratos ganados y asigna pagos a colaboradores.
                    </p>
                </div>
            </div>

            <DataTable
                data={projects as ProjectItem[]}
                columns={columns}
                isLoading={isLoading}
                emptyIcon={<FolderKanban className="w-8 h-8" />}
                emptyTitle="Sin proyectos activos"
                emptyDescription="No tienes proyectos en ejecución. Cuando una propuesta se marque como Ganada, se convertirá en un proyecto automáticamente."
                onRowClick={(project) => router.push(`/dashboard/projects/${project.id}`)}
            />
        </DashboardShell>
    );
}
