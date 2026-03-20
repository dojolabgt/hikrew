'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';
import { projectsApi } from '@/features/projects/api';
import { ProjectData } from '../layout';

const CURRENCY_OPTIONS = [
    { code: 'GTQ', label: 'GTQ – Quetzal' },
    { code: 'USD', label: 'USD – Dollar' },
    { code: 'EUR', label: 'EUR – Euro' },
    { code: 'MXN', label: 'MXN – Peso Mexicano' },
    { code: 'GBP', label: 'GBP – Pound' },
    { code: 'COP', label: 'COP – Peso Colombiano' },
    { code: 'BRL', label: 'BRL – Real Brasileño' },
];

interface Props {
    project: ProjectData;
    onSaved: () => void;
}

export function EditProjectDialog({ project, onSaved }: Props) {
    const { activeWorkspace } = useAuth();
    const { t } = useWorkspaceSettings();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description ?? '');
    const [status, setStatus] = useState(project.status);
    const [currency, setCurrency] = useState(project.currency ?? '');
    const [budget, setBudget] = useState(project.budget != null ? String(project.budget) : '');

    useEffect(() => {
        if (open) {
            setName(project.name);
            setDescription(project.description ?? '');
            setStatus(project.status);
            setCurrency(project.currency ?? '');
            setBudget(project.budget != null ? String(project.budget) : '');
        }
    }, [open, project]);

    const isStandalone = !project.dealId;

    const handleSave = async () => {
        if (!name.trim() || !activeWorkspace?.id) return;
        setSaving(true);
        try {
            await projectsApi.update(activeWorkspace.id, project.id, {
                name: name.trim(),
                description: description.trim() || undefined,
                status,
                ...(isStandalone && {
                    currency: currency || undefined,
                    budget: budget ? Number(budget) : null,
                }),
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

    const currencyOptions = activeWorkspace?.currencies?.length
        ? activeWorkspace.currencies.map((c: { code: string; name?: string; symbol?: string }) => ({
              code: c.code,
              label: `${c.code}${c.name ? ` – ${c.name}` : ''}`,
          }))
        : CURRENCY_OPTIONS;

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                onClick={() => setOpen(true)}
                title={t('editProject.title')}
            >
                <Pencil className="w-4 h-4" />
            </Button>

            <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="w-4 h-4 text-primary" />
                            {t('editProject.title')}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {t('editProject.nameLabel')}
                            </label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('projects.createNamePlaceholder')}
                                autoFocus
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {t('editProject.descLabel')}
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t('projects.createDescPlaceholder')}
                                rows={3}
                                className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                            />
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {t('editProject.statusLabel')}
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            >
                                <option value="ACTIVE">{t('editProject.statusActive')}</option>
                                <option value="COMPLETED">{t('editProject.statusCompleted')}</option>
                            </select>
                        </div>

                        {/* Currency + Budget (standalone only) */}
                        {isStandalone && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        {t('editProject.currencyLabel')}
                                    </label>
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    >
                                        <option value="">{t('projects.createCurrencyNone')}</option>
                                        {currencyOptions.map((c: { code: string; label: string }) => (
                                            <option key={c.code} value={c.code}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button size="sm" disabled={saving || !name.trim()} onClick={handleSave}>
                            {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            {saving ? t('editProject.savingBtn') : t('editProject.saveBtn')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
