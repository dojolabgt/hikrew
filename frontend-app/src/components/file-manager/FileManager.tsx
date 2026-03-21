'use client';

import React, { useRef, useState, useCallback } from 'react';
import {
    Upload, Trash2, ExternalLink, Loader2,
    File, FileImage, FileVideo, FileArchive, FileText,
    LayoutGrid, List, Copy, Check, FolderOpen, Folder,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { DriveFile } from '@/features/projects/driveApi';

const MIME_FOLDER = 'application/vnd.google-apps.folder';
const isFolder = (f: DriveFile) => f.mimeType === MIME_FOLDER;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes?: string) {
    const n = parseInt(bytes ?? '0', 10);
    if (!n) return '';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

function getFileIcon(mimeType: string, className?: string) {
    if (mimeType.startsWith('image/')) return <FileImage className={className} />;
    if (mimeType.startsWith('video/')) return <FileVideo className={className} />;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed'))
        return <FileArchive className={className} />;
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet'))
        return <FileText className={className} />;
    return <File className={className} />;
}

const MIME_COLOR: Record<string, string> = {
    'image/': 'text-violet-500 bg-violet-50 dark:bg-zinc-800',
    'video/': 'text-blue-500 bg-blue-50 dark:bg-zinc-800',
    'application/pdf': 'text-red-500 bg-red-50 dark:bg-zinc-800',
    'zip': 'text-amber-500 bg-amber-50 dark:bg-zinc-800',
    'document': 'text-sky-500 bg-sky-50 dark:bg-zinc-800',
    'sheet': 'text-emerald-500 bg-emerald-50 dark:bg-zinc-800',
};

function getIconColor(mimeType: string) {
    for (const [key, cls] of Object.entries(MIME_COLOR)) {
        if (mimeType.startsWith(key) || mimeType.includes(key)) return cls;
    }
    return 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800';
}

// ─── Copy-link button ─────────────────────────────────────────────────────────

function CopyButton({ url }: { url: string }) {
    const [copied, setCopied] = useState(false);
    const handle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(url).catch(() => {});
        setCopied(true);
        toast.success('Enlace copiado');
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={handle}
            className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Copiar enlace"
        >
            {copied
                ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                : <Copy className="w-3.5 h-3.5" />
            }
        </button>
    );
}

// ─── Folder card ──────────────────────────────────────────────────────────────

function FolderCard({ file, view, onOpen }: { file: DriveFile; view: 'grid' | 'list'; onOpen: (f: DriveFile) => void }) {
    if (view === 'list') {
        return (
            <button
                onClick={() => onOpen(file)}
                className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors text-left"
            >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-amber-500 bg-amber-50 dark:bg-amber-900/20">
                    <Folder className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-100 truncate">{file.name}</p>
                    <p className="text-[11px] text-zinc-400">Carpeta · {formatDate(file.createdTime)}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-300 group-hover:text-amber-400 transition-colors shrink-0" />
            </button>
        );
    }

    return (
        <button
            onClick={() => onOpen(file)}
            className="group relative flex flex-col rounded-xl border bg-amber-50/60 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-800/30 overflow-hidden transition-all hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm text-left"
        >
            <div className="h-[72px] flex items-center justify-center">
                <Folder className="w-9 h-9 text-amber-400 dark:text-amber-500" />
            </div>
            <div className="px-2.5 py-2 border-t border-amber-200/40 dark:border-amber-800/20">
                <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 truncate" title={file.name}>
                    {file.name}
                </p>
                <p className="text-[10px] text-amber-500/70 mt-0.5">Carpeta</p>
            </div>
        </button>
    );
}

// ─── Grid card ────────────────────────────────────────────────────────────────

function GridCard({
    file,
    deleting,
    onDelete,
}: {
    file: DriveFile;
    deleting: boolean;
    onDelete: (id: string) => void;
}) {
    const iconColor = getIconColor(file.mimeType);

    return (
        <div className="group relative flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden transition-all hover:shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700">
            {/* Icon area */}
            <div className="h-[72px] flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/80 relative">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconColor)}>
                    {getFileIcon(file.mimeType, 'w-5 h-5')}
                </div>
                {/* Hover actions overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                    <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-white/90 dark:bg-zinc-900/90 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white shadow transition-colors">
                        <ExternalLink className="w-3 h-3" />
                    </a>
                    <div className="w-6 h-6 flex items-center justify-center rounded-md bg-white/90 dark:bg-zinc-900/90 shadow [&>button]:w-6 [&>button]:h-6">
                        <CopyButton url={file.webViewLink} />
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(file.id); }} disabled={deleting}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-white/90 dark:bg-zinc-900/90 text-zinc-400 hover:text-red-500 shadow transition-colors disabled:opacity-40">
                        {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </button>
                </div>
            </div>
            {/* Info */}
            <div className="px-2.5 py-2 min-w-0">
                <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-100 truncate leading-snug" title={file.name}>
                    {file.name}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                    {[formatBytes(file.size), formatDate(file.createdTime)].filter(Boolean).join(' · ')}
                </p>
            </div>
        </div>
    );
}

// ─── List row ─────────────────────────────────────────────────────────────────

function ListRow({
    file,
    deleting,
    onDelete,
}: {
    file: DriveFile;
    deleting: boolean;
    onDelete: (id: string) => void;
}) {
    const iconColor = getIconColor(file.mimeType);

    return (
        <div className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-colors">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', iconColor)}>
                {getFileIcon(file.mimeType, 'w-4 h-4')}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-100 truncate">{file.name}</p>
                <p className="text-[11px] text-zinc-400">
                    {[formatBytes(file.size), formatDate(file.createdTime)].filter(Boolean).join(' · ')}
                </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <CopyButton url={file.webViewLink} />
                <button
                    onClick={() => onDelete(file.id)}
                    disabled={deleting}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                >
                    {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export type FileManagerView = 'grid' | 'list';

export interface FileManagerProps {
    files: DriveFile[];
    isLoading: boolean;
    onUpload: (file: File) => Promise<DriveFile | void>;
    onDelete: (fileId: string) => Promise<void>;
    /** Called when user clicks a folder card — enables folder navigation */
    onFolderOpen?: (file: DriveFile) => void;
    folderUrl?: string;
    defaultView?: FileManagerView;
    /** Show a "Create folder" prompt instead of the file list */
    needsFolder?: boolean;
    onCreateFolder?: () => Promise<void>;
    creatingFolder?: boolean;
    className?: string;
}

export function FileManager({
    files: initialFiles,
    isLoading,
    onUpload,
    onDelete,
    onFolderOpen,
    folderUrl,
    defaultView = 'grid',
    needsFolder,
    onCreateFolder,
    creatingFolder,
    className,
}: FileManagerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [view, setView] = useState<FileManagerView>(defaultView);
    const [files, setFiles] = useState<DriveFile[]>(initialFiles);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [dropDragging, setDropDragging] = useState(false); // file-from-OS drag

    // Sync when parent updates files
    React.useEffect(() => { setFiles(initialFiles); }, [initialFiles]);

    const handleUpload = async (fileObj: File) => {
        setUploading(true);
        try {
            const uploaded = await onUpload(fileObj);
            if (uploaded) setFiles((prev) => [uploaded, ...prev]);
            toast.success('Archivo subido');
        } catch {
            toast.error('Error al subir archivo');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (fileId: string) => {
        if (!confirm('¿Eliminar este archivo de Drive?')) return;
        setDeletingId(fileId);
        try {
            await onDelete(fileId);
            setFiles((prev) => prev.filter((f) => f.id !== fileId));
            toast.success('Archivo eliminado');
        } catch {
            toast.error('Error al eliminar archivo');
        } finally {
            setDeletingId(null);
        }
    };

    // OS-drag-and-drop (upload)
    const onOsDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDropDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onUpload]);

    // ── Needs folder state ─────────────────────────────────────────────────────
    if (needsFolder) {
        return (
            <div className={cn('flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 py-14 text-center', className)}>
                <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-white/[0.05] flex items-center justify-center mb-3">
                    <FolderOpen className="w-5 h-5 text-zinc-400 dark:text-white/30" />
                </div>
                <p className="text-[14px] font-semibold text-zinc-700 dark:text-white mb-1">Sin carpeta de Drive</p>
                <p className="text-[12px] text-zinc-400 max-w-[200px] leading-relaxed mb-4">
                    Crea una carpeta para este proyecto en Google Drive
                </p>
                {onCreateFolder && (
                    <button
                        onClick={onCreateFolder}
                        disabled={creatingFolder}
                        className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[12px] font-semibold hover:bg-zinc-800 dark:hover:bg-white/90 transition-colors disabled:opacity-50"
                    >
                        {creatingFolder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderOpen className="w-3.5 h-3.5" />}
                        {creatingFolder ? 'Creando...' : 'Crear carpeta'}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn('flex flex-col gap-0', className)}
            onDrop={onOsDrop}
            onDragOver={(e) => { e.preventDefault(); setDropDragging(true); }}
            onDragLeave={(e) => {
                // only fire when leaving the container entirely
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropDragging(false);
            }}
        >
            {/* Header */}
            <div className={cn(
                'flex items-center justify-between gap-3 px-1 pb-3 rounded-lg transition-colors',
                dropDragging && 'bg-primary/5',
            )}>
                <div className="flex items-center gap-2">
                    {/* View toggle */}
                    <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg p-0.5">
                        {([
                            { v: 'grid', Icon: LayoutGrid, title: 'Cuadrícula' },
                            { v: 'list', Icon: List,        title: 'Lista' },
                        ] as const).map(({ v, Icon, title }) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                title={title}
                                className={cn(
                                    'w-7 h-7 flex items-center justify-center rounded-md transition-colors',
                                    view === v
                                        ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-white shadow-sm'
                                        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-white/70',
                                )}
                            >
                                <Icon className="w-3.5 h-3.5" />
                            </button>
                        ))}
                    </div>
                    <span className="text-[12px] text-zinc-400 tabular-nums">
                        {files.length} {files.length === 1 ? 'archivo' : 'archivos'}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {folderUrl && (
                        <a
                            href={folderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] font-medium text-zinc-600 dark:text-white/60 hover:bg-zinc-50 dark:hover:bg-white/[0.05] transition-colors"
                        >
                            <ExternalLink className="w-3 h-3" />
                            Ver carpeta
                        </a>
                    )}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-semibold hover:bg-zinc-800 dark:hover:bg-white/90 transition-colors disabled:opacity-50"
                    >
                        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        {uploading ? 'Subiendo...' : 'Subir'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                    />
                </div>
            </div>

            {/* OS drag hint */}
            {dropDragging && (
                <div className="mb-3 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 text-primary text-[12px] font-medium">
                    <Upload className="w-3.5 h-3.5" />
                    Suelta para subir
                </div>
            )}

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20 gap-2 text-zinc-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[13px]">Cargando archivos...</span>
                </div>
            ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-white/[0.05] flex items-center justify-center mb-3">
                        <FolderOpen className="w-5 h-5 text-zinc-300 dark:text-white/20" />
                    </div>
                    <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Sin archivos</p>
                    <p className="text-[12px] text-zinc-400 dark:text-zinc-500">
                        Sube un archivo o arrástralo aquí
                    </p>
                </div>
            ) : view === 'grid' ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                    {files.map((file) =>
                        isFolder(file) ? (
                            <FolderCard key={file.id} file={file} view="grid" onOpen={onFolderOpen ?? (() => {})} />
                        ) : (
                            <GridCard
                                key={file.id}
                                file={file}
                                deleting={deletingId === file.id}
                                onDelete={handleDelete}
                            />
                        )
                    )}
                </div>
            ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {files.map((file) =>
                        isFolder(file) ? (
                            <FolderCard key={file.id} file={file} view="list" onOpen={onFolderOpen ?? (() => {})} />
                        ) : (
                            <ListRow
                                key={file.id}
                                file={file}
                                deleting={deletingId === file.id}
                                onDelete={handleDelete}
                            />
                        )
                    )}
                </div>
            )}
        </div>
    );
}
