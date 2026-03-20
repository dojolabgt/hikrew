'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    FileText, FolderPlus, Upload, Trash2, ExternalLink,
    Loader2, HardDrive, FolderOpen, File, FileImage, FileVideo,
    FileArchive, Settings, Plus, ChevronDown, ChevronUp,
    LayoutTemplate, CheckCircle2, Circle, ArrowLeft, ArrowRight,
    Copy, Check,
} from 'lucide-react';
import { useProject } from '../layout';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';
import { useBriefTemplates, BriefTemplate } from '@/hooks/use-brief-templates';
import { projectDriveApi, DriveFile } from '@/features/projects/driveApi';
import { projectsApi } from '@/features/projects/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
    if (mimeType.startsWith('image/')) return <FileImage className={className} />;
    if (mimeType.startsWith('video/')) return <FileVideo className={className} />;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed'))
        return <FileArchive className={className} />;
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet'))
        return <FileText className={className} />;
    return <File className={className} />;
}

function formatBytes(bytes?: string) {
    const n = parseInt(bytes ?? '0', 10);
    if (!n) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Add Brief Dialog (template picker flow) ──────────────────────────────────

function AddBriefDialog({
    open,
    onClose,
    onSaved,
    workspaceId,
    projectId,
}: {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    workspaceId: string;
    projectId: string;
}) {
    const { t } = useWorkspaceSettings();
    const { templates, isLoading, fetchTemplates } = useBriefTemplates(workspaceId);
    const [selected, setSelected] = useState<BriefTemplate | null>(null);
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open) fetchTemplates();
    }, [open, fetchTemplates]);

    const handleSelect = (tpl: BriefTemplate) => {
        if (!tpl.isActive) return;
        setSelected(tpl);
        setName(tpl.name);
    };

    const handleConfirm = async () => {
        if (!selected || !name.trim()) return;
        setIsSaving(true);
        try {
            await projectsApi.createBrief(workspaceId, projectId, {
                name: name.trim(),
                templateId: selected.id,
            });
            toast.success(t('assets.briefCreated'));
            onSaved();
            handleClose();
        } catch {
            toast.error(t('assets.briefCreateError'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setSelected(null);
        setName('');
        onClose();
    };

    const activeTemplates = templates.filter((tpl) => tpl.isActive);

    return (
        <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <LayoutTemplate className="w-4 h-4 text-primary" />
                        {selected ? t('assets.addBriefConfirmTitle') : t('assets.addBriefTitle')}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {!selected ? (
                        isLoading ? (
                            <div className="flex items-center justify-center py-12 text-zinc-400 gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">{t('assets.briefLoadingTemplates')}</span>
                            </div>
                        ) : activeTemplates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <LayoutTemplate className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">{t('assets.briefNoTemplates')}</p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500">{t('assets.briefNoTemplatesDesc')}</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {templates.map((tpl) => (
                                    <button
                                        key={tpl.id}
                                        type="button"
                                        disabled={!tpl.isActive}
                                        onClick={() => handleSelect(tpl)}
                                        className={cn(
                                            'w-full text-left flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl border transition-colors',
                                            tpl.isActive
                                                ? 'border-zinc-200 dark:border-zinc-800 hover:border-primary/40 hover:bg-primary/5 cursor-pointer'
                                                : 'border-zinc-100 dark:border-zinc-900 opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900/30',
                                        )}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                <FileText className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{tpl.name}</p>
                                                {tpl.description && (
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{tpl.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                                {tpl.schema?.length ?? 0} {t('brief.fieldsCount')}
                                            </span>
                                            {tpl.isActive
                                                ? <ArrowRight className="w-4 h-4 text-zinc-400" />
                                                : <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{t('brief.statusInactive')}</span>
                                            }
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('assets.briefNameLabel')}</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t('assets.briefNamePlaceholder')}
                                    autoFocus
                                />
                            </div>
                            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t('assets.briefPreviewLabel')}</p>
                                </div>
                                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {(selected.schema ?? []).map((field, idx) => (
                                        <div key={field.id ?? idx} className="flex items-start gap-3 px-4 py-3">
                                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <p className="text-sm text-zinc-800 dark:text-zinc-200">{field.label}</p>
                                                {field.required && (
                                                    <span className="text-[10px] text-red-500">* {t('brief.requiredSingular')}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {(selected.schema ?? []).length === 0 && (
                                        <p className="text-sm text-zinc-400 italic px-4 py-4">{t('brief.noQuestionsYet')}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                    {selected ? (
                        <>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(null)} className="gap-1.5">
                                <ArrowLeft className="w-3.5 h-3.5" />
                                {t('assets.briefBackBtn')}
                            </Button>
                            <Button size="sm" disabled={isSaving || !name.trim()} onClick={handleConfirm} className="gap-1.5">
                                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                {t('assets.briefSaveBtn')}
                            </Button>
                        </>
                    ) : (
                        <Button type="button" variant="ghost" size="sm" onClick={handleClose} className="ml-auto">
                            {t('assets.briefCancelBtn')}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Brief Card ───────────────────────────────────────────────────────────────

function BriefCard({
    brief,
    isOwner,
    onDelete,
}: {
    brief: {
        id: string;
        name: string;
        isCompleted: boolean;
        templateSnapshot?: { id: string; label: string; type: string }[];
        responses?: Record<string, string | string[]>;
    };
    isOwner: boolean;
    onDelete?: (id: string) => void;
}) {
    const { t } = useWorkspaceSettings();
    const [expanded, setExpanded] = useState(false);
    const fields = brief.templateSnapshot ?? [];
    const totalFields = fields.length;
    const answeredFields = fields.filter((f) => {
        const ans = brief.responses?.[f.id];
        return ans !== undefined && ans !== '' && !(Array.isArray(ans) && ans.length === 0);
    }).length;

    return (
        <div className={cn(
            'border rounded-xl overflow-hidden transition-colors',
            brief.isCompleted
                ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-900/5'
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950',
        )}>
            <div
                role="button"
                tabIndex={0}
                onClick={() => setExpanded(!expanded)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setExpanded(!expanded)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
            >
                {/* Completion icon */}
                <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    brief.isCompleted
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                        : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800',
                )}>
                    {brief.isCompleted
                        ? <CheckCircle2 className="w-4 h-4" />
                        : <Circle className="w-4 h-4" />
                    }
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {brief.name}
                    </p>
                    {totalFields > 0 && (
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                            {answeredFields}/{totalFields} {t('assets.briefQuestions')}
                            {totalFields > 0 && (
                                <span className="ml-2">
                                    <span
                                        className="inline-block h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 relative overflow-hidden"
                                        style={{ width: 32 }}
                                    >
                                        <span
                                            className={cn('absolute left-0 top-0 h-full rounded-full', brief.isCompleted ? 'bg-emerald-500' : 'bg-violet-400')}
                                            style={{ width: `${totalFields > 0 ? Math.round((answeredFields / totalFields) * 100) : 0}%` }}
                                        />
                                    </span>
                                </span>
                            )}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {brief.isCompleted && (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-[10px] px-1.5">
                            {t('assets.briefCompleted')}
                        </Badge>
                    )}
                    {isOwner && onDelete && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onDelete(brief.id); }}
                            className="p-1 rounded text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {expanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                </div>
            </div>

            {expanded && (
                <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-4 bg-zinc-50/50 dark:bg-zinc-900/20">
                    {fields.length > 0 ? (
                        <div className="space-y-4">
                            {fields.map((field, idx) => {
                                const answer = brief.responses?.[field.id];
                                return (
                                    <div key={field.id} className="relative pl-5 border-l-2 border-zinc-200 dark:border-zinc-700">
                                        <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[9px] font-bold text-zinc-500">
                                            {idx + 1}
                                        </div>
                                        <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{field.label}</p>
                                        <div className="text-[13px] text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
                                            {answer !== undefined && answer !== '' ? (
                                                Array.isArray(answer) ? (
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        {answer.map((a, i) => <li key={i}>{a}</li>)}
                                                    </ul>
                                                ) : (
                                                    <p className="whitespace-pre-wrap">{String(answer)}</p>
                                                )
                                            ) : (
                                                <span className="italic text-zinc-400">{t('assets.briefNoAnswer')}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-400 italic text-center py-4">{t('assets.briefNoTemplate')}</p>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Briefs Section ───────────────────────────────────────────────────────────

function BriefsSection() {
    const { project, isOwner, refreshProject } = useProject();
    const { activeWorkspace } = useAuth();
    const { t } = useWorkspaceSettings();
    const [showAdd, setShowAdd] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const dealBrief = project.deal?.brief;
    const projectBriefs = project.briefs ?? [];

    const handleDelete = async (briefId: string) => {
        if (!confirm(t('assets.briefDeleteConfirm'))) return;
        setDeletingId(briefId);
        try {
            await projectsApi.deleteBrief(activeWorkspace!.id, project.id, briefId);
            toast.success(t('assets.briefDeleted'));
            await refreshProject();
        } catch {
            toast.error(t('assets.briefDeleteError'));
        } finally {
            setDeletingId(null);
        }
    };

    const hasBriefs = !!dealBrief || projectBriefs.length > 0;

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                        {t('assets.briefsTitle')}
                    </h3>
                    <p className="text-[12px] text-zinc-500">{t('assets.briefsDesc')}</p>
                </div>
                {isOwner && (
                    <Button size="sm" variant="outline" onClick={() => setShowAdd(true)} className="gap-1.5 text-xs">
                        <Plus className="w-3.5 h-3.5" />
                        {t('assets.addBriefBtn')}
                    </Button>
                )}
            </div>

            {hasBriefs ? (
                <div className="space-y-2">
                    {dealBrief && (
                        <BriefCard
                            brief={{
                                id: 'deal-brief',
                                name: t('assets.dealBriefLabel'),
                                isCompleted: true,
                                templateSnapshot: dealBrief.template?.schema?.map((f) => ({
                                    id: f.id,
                                    label: f.label,
                                    type: 'text',
                                })) ?? [],
                                responses: dealBrief.responses,
                            }}
                            isOwner={false}
                        />
                    )}
                    {projectBriefs
                        .slice()
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((brief) => (
                            <BriefCard
                                key={brief.id}
                                brief={{
                                    id: brief.id,
                                    name: brief.name,
                                    isCompleted: brief.isCompleted,
                                    templateSnapshot: brief.templateSnapshot ?? [],
                                    responses: brief.responses,
                                }}
                                isOwner={isOwner}
                                onDelete={deletingId ? undefined : handleDelete}
                            />
                        ))}
                </div>
            ) : (
                <div className="flex-1 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center flex flex-col items-center justify-center">
                    <LayoutTemplate className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                    <p className="text-[13px] font-medium text-zinc-500 mb-1">{t('assets.briefsEmptyTitle')}</p>
                    <p className="text-[12px] text-zinc-400">{t('assets.briefsEmptyDesc')}</p>
                    {isOwner && (
                        <Button size="sm" variant="outline" className="mt-4 gap-1.5 text-xs" onClick={() => setShowAdd(true)}>
                            <Plus className="w-3.5 h-3.5" />
                            {t('assets.addBriefBtn')}
                        </Button>
                    )}
                </div>
            )}

            {activeWorkspace && (
                <AddBriefDialog
                    open={showAdd}
                    onClose={() => setShowAdd(false)}
                    onSaved={refreshProject}
                    workspaceId={activeWorkspace.id}
                    projectId={project.id}
                />
            )}
        </div>
    );
}

// ─── Drive Section ────────────────────────────────────────────────────────────

function CopyLinkButton({ url }: { url: string }) {
    const { t } = useWorkspaceSettings();
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success(t('assets.driveLinkCopied'));
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Could not copy link');
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 dark:text-white/35 hover:text-zinc-700 dark:hover:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/[0.07] transition-colors"
            title={t('assets.driveCopyLink')}
        >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    );
}

function DriveSection() {
    const { project, refreshProject } = useProject();
    const { activeWorkspace } = useAuth();
    const { t } = useWorkspaceSettings();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isDriveConnected = !!(activeWorkspace?.googleDriveEmail);
    const hasDriveFolder = !!project.driveFolderId;

    const [files, setFiles] = useState<DriveFile[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

    useEffect(() => {
        if (!isDriveConnected || !hasDriveFolder) return;
        setLoadingFiles(true);
        projectDriveApi.getFiles(project.id)
            .then(setFiles)
            .catch(() => toast.error(t('assets.driveLoadError')))
            .finally(() => setLoadingFiles(false));
    }, [project.id, isDriveConnected, hasDriveFolder, t]);

    const handleCreateFolder = async () => {
        setCreatingFolder(true);
        try {
            await projectDriveApi.createFolder(project.id);
            toast.success(t('assets.driveFolderCreated'));
            await refreshProject();
        } catch {
            toast.error(t('assets.driveFolderError'));
        } finally {
            setCreatingFolder(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingFile(true);
        try {
            const uploaded = await projectDriveApi.uploadFile(project.id, file);
            setFiles((prev) => [uploaded, ...prev]);
            toast.success(t('assets.driveUploadSuccess'));
        } catch {
            toast.error(t('assets.driveUploadError'));
        } finally {
            setUploadingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (fileId: string) => {
        if (!confirm(t('assets.driveDeleteConfirm'))) return;
        setDeletingFileId(fileId);
        try {
            await projectDriveApi.deleteFile(project.id, fileId);
            setFiles((prev) => prev.filter((f) => f.id !== fileId));
            toast.success(t('assets.driveDeleteSuccess'));
        } catch {
            toast.error(t('assets.driveDeleteError'));
        } finally {
            setDeletingFileId(null);
        }
    };

    if (!isDriveConnected) {
        return (
            <div className="rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center flex flex-col items-center justify-center h-full min-h-[160px]">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/[0.05] flex items-center justify-center mb-3">
                    <HardDrive className="w-5 h-5 text-zinc-400 dark:text-white/30" />
                </div>
                <h3 className="font-semibold text-[14px] text-zinc-900 dark:text-white mb-1">
                    {t('assets.driveNotConnectedTitle')}
                </h3>
                <p className="text-[12px] text-zinc-500 dark:text-white/45 max-w-[220px] mx-auto mb-4 leading-relaxed">
                    {t('assets.driveNotConnectedDesc')}
                </p>
                <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/settings/integrations')} className="gap-2 text-xs">
                    <Settings className="w-3.5 h-3.5" />
                    {t('assets.driveNotConnectedBtn')}
                </Button>
            </div>
        );
    }

    if (!hasDriveFolder) {
        return (
            <div className="rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center flex flex-col items-center justify-center h-full min-h-[160px]">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/[0.05] flex items-center justify-center mb-3">
                    <FolderPlus className="w-5 h-5 text-zinc-400 dark:text-white/30" />
                </div>
                <h3 className="font-semibold text-[14px] text-zinc-900 dark:text-white mb-1">
                    {t('assets.driveNoFolderTitle')}
                </h3>
                <p className="text-[12px] text-zinc-500 dark:text-white/45 max-w-[220px] mx-auto mb-4 leading-relaxed">
                    {t('assets.driveNoFolderDesc')}
                </p>
                <Button size="sm" onClick={handleCreateFolder} disabled={creatingFolder} className="gap-2 text-xs">
                    {creatingFolder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
                    {creatingFolder ? t('assets.driveCreatingFolder') : t('assets.driveCreateFolderBtn')}
                </Button>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/30">
                <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-zinc-500 dark:text-white/50" />
                    <div>
                        <p className="text-[13px] font-semibold text-zinc-900 dark:text-white leading-tight">
                            {t('assets.driveSection')}
                        </p>
                        <p className="text-[11px] text-zinc-400 dark:text-white/35">
                            {files.length} {files.length === 1 ? t('assets.filesSingular') : t('assets.filesPlural')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {project.driveFolderUrl && (
                        <a
                            href={project.driveFolderUrl as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] font-medium text-zinc-600 dark:text-white/60 hover:bg-zinc-50 dark:hover:bg-white/[0.05] transition-colors"
                        >
                            <ExternalLink className="w-3 h-3" />
                            {t('assets.driveViewFolder')}
                        </a>
                    )}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-semibold hover:bg-zinc-800 dark:hover:bg-white/90 transition-colors disabled:opacity-50"
                    >
                        {uploadingFile ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        {uploadingFile ? t('assets.driveUploading') : t('assets.driveUploadBtn')}
                    </button>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
                </div>
            </div>

            {/* File list */}
            {loadingFiles ? (
                <div className="flex items-center justify-center gap-2 py-8 text-[12px] text-zinc-400 dark:text-white/35">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('assets.driveLoading')}
                </div>
            ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                    <div className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-white/[0.04] flex items-center justify-center mb-2">
                        <Upload className="w-4 h-4 text-zinc-300 dark:text-white/25" />
                    </div>
                    <p className="text-[13px] font-medium text-zinc-700 dark:text-white/60 mb-1">{t('assets.driveEmptyTitle')}</p>
                    <p className="text-[11px] text-zinc-400 dark:text-white/35">{t('assets.driveEmptyDesc')}</p>
                </div>
            ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 overflow-y-auto">
                    {files.map((file) => (
                        <div
                            key={file.id}
                            className="group flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors"
                        >
                            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                                <FileIcon mimeType={file.mimeType} className="w-3.5 h-3.5 text-zinc-500 dark:text-white/50" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-zinc-900 dark:text-white truncate">{file.name}</p>
                                <p className="text-[11px] text-zinc-400 dark:text-white/35">
                                    {formatBytes(file.size)} · {formatDate(file.createdTime)}
                                </p>
                            </div>
                            <div className={cn('flex items-center gap-0.5 transition-opacity', 'opacity-0 group-hover:opacity-100')}>
                                <CopyLinkButton url={file.webViewLink} />
                                <a
                                    href={file.webViewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 dark:text-white/35 hover:text-zinc-700 dark:hover:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/[0.07] transition-colors"
                                    title={t('assets.driveOpenInDrive')}
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <button
                                    onClick={() => handleDelete(file.id)}
                                    disabled={deletingFileId === file.id}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                                    title={t('assets.driveDeleteFile')}
                                >
                                    {deletingFileId === file.id
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : <Trash2 className="w-3.5 h-3.5" />
                                    }
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectAssetsPage() {
    const { t } = useWorkspaceSettings();

    return (
        <div className="space-y-2">
            <div className="mb-5">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t('assets.title')}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{t('assets.titleDesc')}</p>
            </div>

            {/* 2-col layout: Briefs | Drive */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <BriefsSection />
                <div>
                    <div className="mb-4">
                        <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                            {t('assets.driveSection')}
                        </h3>
                        <p className="text-[12px] text-zinc-500">{t('assets.driveSectionDesc')}</p>
                    </div>
                    <DriveSection />
                </div>
            </div>
        </div>
    );
}
