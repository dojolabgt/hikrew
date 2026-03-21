'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HardDrive, Settings, FolderOpen, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { workspacesApi } from '@/features/workspaces/api';
import { FileManager } from '@/components/file-manager/FileManager';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/button';
import type { DriveFile } from '@/features/projects/driveApi';

interface FolderCrumb { id: string; name: string }

export default function FilesPage() {
    const { activeWorkspace } = useAuth();
    const router = useRouter();

    const isDriveConnected = !!(activeWorkspace?.googleDriveEmail);
    const hasRootFolder = !!(activeWorkspace as any)?.googleDriveRootFolderId;

    const [files, setFiles] = useState<DriveFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [crumbs, setCrumbs] = useState<FolderCrumb[]>([]);

    const currentFolderId = crumbs[crumbs.length - 1]?.id ?? undefined;

    useEffect(() => {
        if (!isDriveConnected || !hasRootFolder) return;
        setIsLoading(true);
        workspacesApi.getDriveFiles(currentFolderId)
            .then(setFiles)
            .catch(() => toast.error('Error al cargar archivos'))
            .finally(() => setIsLoading(false));
    }, [isDriveConnected, hasRootFolder, currentFolderId]);

    const handleFolderOpen = (folder: DriveFile) => {
        setCrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    };

    const navigateToCrumb = (idx: number) => {
        setCrumbs((prev) => prev.slice(0, idx + 1));
    };

    const navigateToRoot = () => setCrumbs([]);

    if (!isDriveConnected) {
        return (
            <DashboardShell>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-white/[0.05] flex items-center justify-center mb-4">
                    <HardDrive className="w-7 h-7 text-zinc-300 dark:text-white/20" />
                </div>
                <h2 className="text-[16px] font-semibold text-zinc-800 dark:text-white mb-2">
                    Google Drive no conectado
                </h2>
                <p className="text-[13px] text-zinc-400 max-w-[260px] leading-relaxed mb-5">
                    Conecta Google Drive en Integraciones para gestionar archivos de tu workspace
                </p>
                <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/settings/integrations')} className="gap-2">
                    <Settings className="w-3.5 h-3.5" />
                    Ir a Integraciones
                </Button>
            </div>
            </DashboardShell>
        );
    }

    if (!hasRootFolder) {
        return (
            <DashboardShell>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-white/[0.05] flex items-center justify-center mb-4">
                    <FolderOpen className="w-7 h-7 text-zinc-300 dark:text-white/20" />
                </div>
                <h2 className="text-[16px] font-semibold text-zinc-800 dark:text-white mb-2">
                    Sin carpeta raíz configurada
                </h2>
                <p className="text-[13px] text-zinc-400 max-w-[260px] leading-relaxed mb-5">
                    Configura una carpeta raíz en Integraciones → Google Drive para usar el file manager global
                </p>
                <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/settings/integrations')} className="gap-2">
                    <Settings className="w-3.5 h-3.5" />
                    Configurar carpeta
                </Button>
            </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell>
            {/* Header */}
            <div className="mb-5">
                <h1 className="text-[22px] font-semibold text-zinc-900 dark:text-white">Archivos</h1>
                {activeWorkspace?.googleDriveEmail && (
                    <p className="text-[12px] text-zinc-400 mt-0.5">{activeWorkspace.googleDriveEmail}</p>
                )}
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 mb-4 flex-wrap">
                <button
                    onClick={navigateToRoot}
                    className={`text-[13px] font-medium transition-colors ${crumbs.length === 0 ? 'text-zinc-800 dark:text-white' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-white'}`}
                >
                    Raíz
                </button>
                {crumbs.map((crumb, idx) => (
                    <span key={crumb.id} className="flex items-center gap-1">
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
                        <button
                            onClick={() => navigateToCrumb(idx)}
                            className={`text-[13px] font-medium transition-colors ${idx === crumbs.length - 1 ? 'text-zinc-800 dark:text-white' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-white'}`}
                        >
                            {crumb.name}
                        </button>
                    </span>
                ))}
            </div>

            <FileManager
                files={files}
                isLoading={isLoading}
                onFolderOpen={handleFolderOpen}
                onUpload={async (file) => {
                    const uploaded = await workspacesApi.uploadDriveFile(file);
                    setFiles((prev) => [uploaded, ...prev]);
                    return uploaded;
                }}
                onDelete={async (fileId) => {
                    await workspacesApi.deleteDriveFile(fileId);
                    setFiles((prev) => prev.filter((f) => f.id !== fileId));
                }}
            />
        </DashboardShell>
    );
}
