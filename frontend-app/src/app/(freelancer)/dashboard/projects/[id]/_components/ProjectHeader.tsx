'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, MoreHorizontal, Pencil, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';
import { projectsApi } from '@/features/projects/api';
import { ProjectData } from '../layout';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    ACTIVE:    { dot: 'bg-primary animate-pulse', text: 'text-primary', label: '' },
    COMPLETED: { dot: 'bg-zinc-300 dark:bg-zinc-600', text: 'text-zinc-400', label: '' },
} as const;

const CURRENCY_OPTIONS = [
    { code: 'GTQ', label: 'GTQ – Quetzal' },
    { code: 'USD', label: 'USD – Dollar' },
    { code: 'EUR', label: 'EUR – Euro' },
    { code: 'MXN', label: 'MXN – Peso Mexicano' },
    { code: 'GBP', label: 'GBP – Pound' },
    { code: 'COP', label: 'COP – Peso Colombiano' },
    { code: 'BRL', label: 'BRL – Real Brasileño' },
];

// ─── Inline title ──────────────────────────────────────────────────────────────

function InlineTitle({
    value,
    onSave,
}: {
    value: string;
    onSave: (v: string) => Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setDraft(value); }, [value]);
    useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

    const commit = useCallback(async () => {
        const trimmed = draft.trim();
        if (!trimmed || trimmed === value) { setEditing(false); setDraft(value); return; }
        setSaving(true);
        await onSave(trimmed);
        setSaving(false);
        setEditing(false);
    }, [draft, value, onSave]);

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { setEditing(false); setDraft(value); }
    };

    if (editing) {
        return (
            <div className="flex items-center gap-2 -ml-1">
                <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={handleKey}
                    disabled={saving}
                    className="text-2xl font-bold text-zinc-900 dark:text-white bg-transparent border-b-2 border-primary focus:outline-none w-full min-w-0 leading-tight pb-0.5"
                />
                {saving && <Loader2 className="w-4 h-4 animate-spin text-zinc-400 shrink-0" />}
            </div>
        );
    }

    return (
        <button
            onClick={() => setEditing(true)}
            className="group flex items-center gap-1.5 text-left -ml-0.5"
            title="Click para editar"
        >
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight">
                {value}
            </h1>
            <Pencil className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </button>
    );
}

// ─── Inline description ────────────────────────────────────────────────────────

function InlineDescription({
    value,
    placeholder,
    onSave,
}: {
    value: string;
    placeholder: string;
    onSave: (v: string) => Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [saving, setSaving] = useState(false);
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { setDraft(value); }, [value]);
    useEffect(() => {
        if (editing && ref.current) {
            ref.current.focus();
            ref.current.setSelectionRange(draft.length, draft.length);
        }
    }, [editing, draft.length]);

    const commit = useCallback(async () => {
        const trimmed = draft.trim();
        if (trimmed === value) { setEditing(false); return; }
        setSaving(true);
        await onSave(trimmed);
        setSaving(false);
        setEditing(false);
    }, [draft, value, onSave]);

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') { setEditing(false); setDraft(value); }
    };

    if (editing) {
        return (
            <div className="relative mt-2">
                <textarea
                    ref={ref}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={handleKey}
                    disabled={saving}
                    rows={2}
                    placeholder={placeholder}
                    className="w-full max-w-2xl text-sm text-zinc-500 dark:text-zinc-400 bg-transparent border-b border-primary/40 focus:border-primary focus:outline-none resize-none leading-relaxed pb-0.5"
                />
                {saving && <Loader2 className="absolute right-0 top-1 w-3.5 h-3.5 animate-spin text-zinc-400" />}
            </div>
        );
    }

    return (
        <button
            onClick={() => setEditing(true)}
            className="group flex items-start gap-1.5 mt-2 text-left max-w-2xl"
            title="Click para editar"
        >
            <p className={cn(
                'text-sm leading-relaxed',
                value ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-300 dark:text-zinc-600 italic',
            )}>
                {value || placeholder}
            </p>
            <Pencil className="w-3 h-3 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
        </button>
    );
}

// ─── Status dropdown ───────────────────────────────────────────────────────────

function StatusDropdown({
    status,
    onSave,
    t,
}: {
    status: string;
    onSave: (v: string) => Promise<void>;
    t: (k: string) => string;
}) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const isCompleted = status === 'COMPLETED';
    const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.ACTIVE;

    const options = [
        { value: 'ACTIVE',    label: t('projects.statusActive'),    dot: 'bg-primary', text: 'text-primary' },
        { value: 'COMPLETED', label: t('projects.statusCompleted'), dot: 'bg-zinc-400', text: 'text-zinc-500' },
    ];

    const handleSelect = async (value: string) => {
        setOpen(false);
        if (value === status) return;
        setSaving(true);
        await onSave(value);
        setSaving(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen((o) => !o)}
                disabled={saving}
                className={cn(
                    'inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider transition-opacity hover:opacity-70',
                    cfg.text,
                )}
            >
                {saving
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
                }
                {isCompleted ? t('projects.statusCompleted') : t('projects.statusActive')}
                <span className="opacity-40">▾</span>
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 top-full mt-1.5 z-20 w-36 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => handleSelect(opt.value)}
                                className={cn(
                                    'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left transition-colors',
                                    'hover:bg-zinc-50 dark:hover:bg-zinc-800',
                                    opt.value === status && 'bg-zinc-50 dark:bg-zinc-800',
                                )}
                            >
                                <span className={cn('w-2 h-2 rounded-full shrink-0', opt.dot)} />
                                <span className={opt.text}>{opt.label}</span>
                                {opt.value === status && <Check className="ml-auto w-3 h-3 text-zinc-400" />}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── More / Full edit dialog ───────────────────────────────────────────────────

function MoreEditDialog({
    project,
    onSaved,
}: {
    project: ProjectData;
    onSaved: () => void;
}) {
    const { activeWorkspace } = useAuth();
    const { t } = useWorkspaceSettings();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currency, setCurrency] = useState(project.currency ?? '');
    const [budget, setBudget] = useState(project.budget != null ? String(project.budget) : '');

    useEffect(() => {
        if (open) {
            setCurrency(project.currency ?? '');
            setBudget(project.budget != null ? String(project.budget) : '');
        }
    }, [open, project]);

    const currencyOptions = activeWorkspace?.currencies?.length
        ? activeWorkspace.currencies.map((c: { code: string; name?: string }) => ({
              code: c.code,
              label: `${c.code}${c.name ? ` – ${c.name}` : ''}`,
          }))
        : CURRENCY_OPTIONS;

    const handleSave = async () => {
        if (!activeWorkspace?.id) return;
        setSaving(true);
        try {
            await projectsApi.update(activeWorkspace.id, project.id, {
                currency: currency || undefined,
                budget: budget ? Number(budget) : null,
            });
            toast.success(t('editProject.successMsg'));
            setOpen(false);
            onSaved();
        } catch {
            toast.error(t('editProject.errorMsg'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="p-1 rounded-md text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title={t('editProject.title')}
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>

            <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{t('editProject.title')}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-1">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                    {t('editProject.currencyLabel')}
                                </label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                >
                                    <option value="">{t('projects.createCurrencyNone')}</option>
                                    {currencyOptions.map((c: { code: string; label: string }) => (
                                        <option key={c.code} value={c.code}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                    {t('editProject.budgetLabel')}
                                </label>
                                <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button size="sm" disabled={saving} onClick={handleSave}>
                            {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            {saving ? t('editProject.savingBtn') : t('editProject.saveBtn')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ─── ProjectHeader ─────────────────────────────────────────────────────────────

interface ProjectHeaderProps {
    project: ProjectData;
    isOwner: boolean;
    isStandalone: boolean;
    clientName: string;
    valueDisplay: string | null;
    onRefresh: () => void;
    t: (k: string) => string;
}

export function ProjectHeader({
    project,
    isOwner,
    isStandalone,
    clientName,
    valueDisplay,
    onRefresh,
    t,
}: ProjectHeaderProps) {
    const { activeWorkspace } = useAuth();
    const isCollaborator = !isOwner;

    const patch = useCallback(async (dto: Record<string, unknown>) => {
        if (!activeWorkspace?.id) return;
        try {
            await projectsApi.update(activeWorkspace.id, project.id, dto);
            onRefresh();
        } catch {
            toast.error(t('editProject.errorMsg'));
        }
    }, [activeWorkspace?.id, project.id, onRefresh, t]);

    return (
        <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0 flex-1">

                    {/* Status row */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {isOwner ? (
                            <StatusDropdown
                                status={project.status}
                                onSave={(v) => patch({ status: v })}
                                t={t}
                            />
                        ) : (
                            <span className={cn(
                                'inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider',
                                project.status === 'COMPLETED' ? 'text-zinc-400' : 'text-primary',
                            )}>
                                <span className={cn(
                                    'w-1.5 h-1.5 rounded-full',
                                    project.status === 'COMPLETED' ? 'bg-zinc-300 dark:bg-zinc-600' : 'bg-primary animate-pulse',
                                )} />
                                {project.status === 'COMPLETED' ? t('projects.statusCompleted') : t('projects.statusActive')}
                            </span>
                        )}
                        {isStandalone && (
                            <span className="text-[11px] font-medium text-violet-500 dark:text-violet-400">· {t('projects.standaloneTag')}</span>
                        )}
                        {isCollaborator && (
                            <span className="text-[11px] font-medium text-indigo-500 dark:text-indigo-400">· {t('projects.collaboratorBadge')}</span>
                        )}
                    </div>

                    {/* Title row */}
                    <div className="flex items-center gap-1.5">
                        {isOwner ? (
                            <InlineTitle
                                value={project.name}
                                onSave={(v) => patch({ name: v })}
                            />
                        ) : (
                            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight">
                                {project.name}
                            </h1>
                        )}
                        {isOwner && isStandalone && (
                            <MoreEditDialog project={project} onSaved={onRefresh} />
                        )}
                    </div>

                    {/* Client */}
                    <p className="text-sm text-zinc-400 mt-1">
                        {clientName !== t('projects.defaultClientName') ? (
                            <>
                                {t('projects.clientLabel')}{' '}
                                <span className="text-zinc-600 dark:text-zinc-300 font-medium">{clientName}</span>
                            </>
                        ) : (
                            <span className="italic">{t('projects.noClientAssigned')}</span>
                        )}
                    </p>

                    {/* Description */}
                    {isOwner ? (
                        <InlineDescription
                            value={project.description ?? ''}
                            placeholder={t('projects.createDescPlaceholder')}
                            onSave={(v) => patch({ description: v || undefined })}
                        />
                    ) : project.description ? (
                        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2 leading-relaxed max-w-2xl">
                            {project.description}
                        </p>
                    ) : null}
                </div>

                {valueDisplay && (
                    <div className="shrink-0 sm:text-right">
                        <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider mb-0.5">
                            {t('projects.valueLabel')}
                        </p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                            {valueDisplay}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            {project.deal?.currency?.code ?? project.currency ?? ''}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
