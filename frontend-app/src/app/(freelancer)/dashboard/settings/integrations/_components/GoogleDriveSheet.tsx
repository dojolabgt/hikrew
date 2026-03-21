'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, Loader2, ExternalLink, ShieldCheck, Unlink, FolderOpen, FolderPlus, Pencil } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { workspacesApi } from '@/features/workspaces/api';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';

interface GoogleDriveSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStatusChange: (connected: boolean, email?: string) => void;
}

export function GoogleDriveSheet({ open, onOpenChange, onStatusChange }: GoogleDriveSheetProps) {
    const { t } = useWorkspaceSettings();
    const [status, setStatus] = useState<{
        connected: boolean;
        email?: string;
        rootFolderId?: string;
        rootFolderName?: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [isSettingFolder, setIsSettingFolder] = useState(false);
    const [editingFolder, setEditingFolder] = useState(false);

    useEffect(() => {
        if (!open) return;
        setIsLoading(true);
        workspacesApi.getGoogleDriveStatus()
            .then(s => setStatus(s))
            .catch(() => setStatus({ connected: false }))
            .finally(() => setIsLoading(false));
    }, [open]);

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            const { url } = await workspacesApi.getGoogleDriveAuthUrl();
            window.location.href = url;
        } catch {
            toast.error(t('integrations.driveConnectError'));
            setIsConnecting(false);
        }
    };

    const handleSetupFolder = async () => {
        if (!folderName.trim()) return;
        setIsSettingFolder(true);
        try {
            const result = await workspacesApi.setupDriveFolder(folderName.trim());
            setStatus(prev => prev ? { ...prev, rootFolderId: result.folderId, rootFolderName: result.folderName } : prev);
            setEditingFolder(false);
            setFolderName('');
            toast.success(t('integrations.driveFolderCreated'));
        } catch {
            toast.error(t('integrations.driveFolderError'));
        } finally {
            setIsSettingFolder(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm(t('integrations.driveDisconnectConfirm'))) return;
        setIsDisconnecting(true);
        try {
            await workspacesApi.disconnectGoogleDrive();
            const next = { connected: false };
            setStatus(next);
            onStatusChange(false);
            toast.success(t('integrations.driveDisconnectSuccess'));
        } catch {
            toast.error(t('integrations.driveDisconnectError'));
        } finally {
            setIsDisconnecting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md overflow-y-auto border-l border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#111111]">
                <SheetHeader className="px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/[0.06]">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/[0.06] border border-gray-100 dark:border-white/[0.08] flex items-center justify-center p-2">
                            <Image
                                src="/integrations/drive-logo.png"
                                alt="Google Drive"
                                width={28}
                                height={28}
                                className="object-contain"
                            />
                        </div>
                        <div>
                            <SheetTitle className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight text-left">
                                {t('integrations.configDrive')}
                            </SheetTitle>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-white/40 mt-0.5">
                                Google Drive · {t('integrations.driveStorageLabel')}
                            </p>
                        </div>
                    </div>
                    <SheetDescription className="text-[13px] text-gray-500 dark:text-white/50 leading-relaxed text-left">
                        {t('integrations.configDriveDesc')}
                    </SheetDescription>
                </SheetHeader>

                <div className="px-6 py-5 space-y-5">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-white/30" />
                        </div>
                    ) : status?.connected ? (
                        <>
                            {/* Connected state */}
                            <div className="flex items-start gap-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30 bg-emerald-50 dark:bg-emerald-900/15 px-4 py-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-[13px] font-semibold text-emerald-800 dark:text-emerald-300">
                                        {t('integrations.connected')}
                                    </p>
                                    {status.email && (
                                        <p className="text-[12px] text-emerald-700/70 dark:text-emerald-400/70 mt-0.5">
                                            {t('integrations.driveConnectedAs')} <span className="font-medium">{status.email}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Scope info */}
                            <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] px-4 py-3">
                                <ShieldCheck className="w-4 h-4 text-gray-400 dark:text-white/40 mt-0.5 shrink-0" />
                                <p className="text-[12px] text-gray-500 dark:text-white/45 leading-snug">
                                    {t('integrations.driveScopeNote')}
                                </p>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />

                            {/* Workspace root folder */}
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <FolderOpen className="w-3.5 h-3.5 text-gray-400 dark:text-white/40" />
                                    <p className="text-[12px] font-semibold text-gray-700 dark:text-white/70 uppercase tracking-wider">
                                        {t('integrations.driveFolderSection')}
                                    </p>
                                </div>
                                <p className="text-[12px] text-gray-400 dark:text-white/35 leading-snug mb-3">
                                    {t('integrations.driveFolderDesc')}
                                </p>

                                {status?.rootFolderId && !editingFolder ? (
                                    <div className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] px-3 py-2.5">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                                            <span className="text-[13px] font-medium text-gray-800 dark:text-white/80 truncate">
                                                {status.rootFolderName}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => { setEditingFolder(true); setFolderName(status.rootFolderName ?? ''); }}
                                            className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors shrink-0"
                                            title={t('integrations.driveFolderRename')}
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={folderName}
                                            onChange={(e) => setFolderName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSetupFolder()}
                                            placeholder={t('integrations.driveFolderPlaceholder')}
                                            className="flex-1 h-9 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 text-[13px] text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                        <button
                                            onClick={handleSetupFolder}
                                            disabled={isSettingFolder || !folderName.trim()}
                                            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 shrink-0"
                                        >
                                            {isSettingFolder
                                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                : <FolderPlus className="w-3.5 h-3.5" />
                                            }
                                            {t('integrations.driveFolderCreate')}
                                        </button>
                                        {editingFolder && (
                                            <button
                                                onClick={() => setEditingFolder(false)}
                                                className="h-9 px-3 rounded-xl border border-gray-200 dark:border-white/[0.08] text-[13px] text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                                            >
                                                {t('common.cancel')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />

                            {/* Disconnect */}
                            <div>
                                <p className="text-[12px] font-medium text-gray-700 dark:text-white/70 mb-1.5">
                                    {t('integrations.driveDisconnectSection')}
                                </p>
                                <p className="text-[12px] text-gray-400 dark:text-white/35 leading-snug mb-3">
                                    {t('integrations.driveDisconnectNote')}
                                </p>
                                <button
                                    onClick={handleDisconnect}
                                    disabled={isDisconnecting}
                                    className="flex items-center gap-2 h-9 px-4 rounded-xl border border-red-200 dark:border-red-800/40 text-[13px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/15 transition-colors disabled:opacity-50"
                                >
                                    {isDisconnecting
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : <Unlink className="w-3.5 h-3.5" />
                                    }
                                    {isDisconnecting ? t('integrations.driveDisconnecting') : t('integrations.driveDisconnectBtn')}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Not connected state */}
                            <div className="flex items-start gap-3 rounded-xl border border-amber-100 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-900/15 px-4 py-3">
                                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-300">
                                        {t('integrations.driveNotConnected')}
                                    </p>
                                    <p className="text-[12px] text-amber-700/70 dark:text-amber-400/70 mt-0.5 leading-snug">
                                        {t('integrations.driveNotConnectedDesc')}
                                    </p>
                                </div>
                            </div>

                            {/* What it does */}
                            <div className="space-y-2.5">
                                {[
                                    t('integrations.driveFeat1'),
                                    t('integrations.driveFeat2'),
                                    t('integrations.driveFeat3'),
                                ].map((feat, i) => (
                                    <div key={i} className="flex items-start gap-2.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-white/30 mt-1.5 shrink-0" />
                                        <p className="text-[13px] text-gray-600 dark:text-white/60 leading-snug">{feat}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Scope note */}
                            <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] px-4 py-3">
                                <ShieldCheck className="w-4 h-4 text-gray-400 dark:text-white/40 mt-0.5 shrink-0" />
                                <p className="text-[12px] text-gray-500 dark:text-white/45 leading-snug">
                                    {t('integrations.driveScopeNote')}
                                </p>
                            </div>

                            <button
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className="w-full h-11 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-semibold hover:bg-gray-800 dark:hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2.5"
                            >
                                {isConnecting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                )}
                                {isConnecting ? t('integrations.driveConnecting') : t('integrations.driveConnectBtn')}
                            </button>

                            <p className="text-center text-[11px] text-gray-400 dark:text-white/30 flex items-center justify-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                {t('integrations.driveOAuthNote')}
                            </p>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
