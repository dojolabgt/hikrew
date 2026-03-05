'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';
import api from '@/lib/api';
import {
    Plus,
    Pencil,
    Trash2,
    Percent,
    X,
    CheckCircle2,
    TagIcon,
    BarChart3,
    Building2,
    Loader2,
} from 'lucide-react';
import paisData from '@/data/localization/pais.json';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AppInput } from '@/components/common/AppInput';

// ─── Types ──────────────────────────────────────────────────────────────────

type TaxAppliesTo = 'all' | 'services' | 'products';

interface WorkspaceTax {
    id: string;
    key: string;
    label: string;
    rate: number;
    appliesTo: TaxAppliesTo;
    description?: string;
    isDefault: boolean;
    isActive: boolean;
    order: number;
}

interface WorkspacePrefs {
    taxInclusivePricing: boolean;
    taxReporting: boolean;
    taxId?: string;
    taxType?: string;
    country?: string;
}

const APPLIES_TO_LABELS: Record<TaxAppliesTo, string> = {
    all: 'taxes.all',
    services: 'taxes.services',
    products: 'taxes.products',
};

// ─── Empty form ───────────────────────────────────────────────────────────────

const emptyForm = {
    key: '',
    label: '',
    rate: '',
    appliesTo: 'all' as TaxAppliesTo,
    description: '',
    isDefault: false,
    isActive: true,
};

// ─── Tax Modal ───────────────────────────────────────────────────────────────

function TaxModal({ open, onClose, onSave, initial }: {
    open: boolean;
    onClose: () => void;
    onSave: (data: typeof emptyForm) => Promise<void>;
    initial?: WorkspaceTax | null;
}) {
    const { t } = useWorkspaceSettings();
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initial) {
            setForm({
                key: initial.key,
                label: initial.label,
                rate: String(Math.round(Number(initial.rate) * 100)),
                appliesTo: initial.appliesTo,
                description: initial.description ?? '',
                isDefault: initial.isDefault,
                isActive: initial.isActive,
            });
        } else {
            setForm(emptyForm);
        }
        setError(null);
    }, [initial, open]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const rateNum = parseFloat(form.rate);
        if (!form.label.trim()) { setError(t('taxes.errNameReq')); return; }
        if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) { setError(t('taxes.errRateRange')); return; }
        setSaving(true); setError(null);
        try {
            await onSave({ ...form, rate: String(rateNum / 100) });
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? t('taxes.errSaving'));
        } finally { setSaving(false); }
    };

    const inputCls = 'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition';
    const labelCls = 'block text-sm font-medium text-zinc-700 mb-1.5';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-zinc-900">{initial ? t('taxes.editTax') : t('taxes.newTax')}</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={labelCls}>{t('taxes.name')}</label>
                        <input className={inputCls} placeholder={t('taxes.namePlaceholder')} value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
                    </div>
                    <div>
                        <label className={labelCls}>{t('taxes.internalKey')} <span className="text-zinc-400 font-normal">{t('taxes.uniqueSlug')}</span></label>
                        <input className={inputCls} placeholder={t('taxes.keyPlaceholder')} value={form.key} disabled={!!initial} onChange={e => setForm(f => ({ ...f, key: e.target.value.toLowerCase().replace(/\s+/g, '_') }))} />
                        {initial && <p className="text-xs text-zinc-400 mt-1">{t('taxes.keyNoChange')}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>{t('taxes.rate')}</label>
                            <div className="relative">
                                <input className={inputCls + ' pr-9'} placeholder="12" type="number" min={0} max={100} step={0.01} value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} />
                                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>{t('taxes.appliesTo')}</label>
                            <select className={inputCls + ' cursor-pointer'} value={form.appliesTo} onChange={e => setForm(f => ({ ...f, appliesTo: e.target.value as TaxAppliesTo }))}>
                                <option value="all">{t('taxes.all')}</option>
                                <option value="services">{t('taxes.services')}</option>
                                <option value="products">{t('taxes.products')}</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>{t('taxes.description')} <span className="text-zinc-400 font-normal">{t('taxes.optional')}</span></label>
                        <input className={inputCls} placeholder={t('taxes.descPlaceholder')} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="flex gap-6 pt-1">
                        <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer select-none">
                            <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} className="rounded" />
                            {t('taxes.mainTax')}
                        </label>
                        <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer select-none">
                            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                            {t('taxes.active')}
                        </label>
                    </div>
                    {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose}>{t('taxes.cancel')}</Button>
                        <PrimaryButton compact type="submit" disabled={saving}>
                            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('taxes.saving')}</> : t('taxes.save')}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TaxesPage() {
    const { t } = useWorkspaceSettings();
    const { activeWorkspace } = useAuth();

    const [taxes, setTaxes] = useState<WorkspaceTax[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<WorkspaceTax | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Workspace-level tax preferences
    const [prefs, setPrefs] = useState<WorkspacePrefs>({
        taxInclusivePricing: false,
        taxReporting: false,
        taxId: '',
        taxType: '',
        country: 'GT',
    });
    const [taxIdValue, setTaxIdValue] = useState('');
    const [savingPrefs, setSavingPrefs] = useState(false);
    const [prefsSaved, setPrefsSaved] = useState(false);

    const load = useCallback(async () => {
        try {
            const { data } = await api.get('/workspaces/current/taxes');
            setTaxes(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Hydrate prefs from activeWorkspace
    useEffect(() => {
        if (activeWorkspace) {
            const ws = activeWorkspace as any;
            setPrefs({
                taxInclusivePricing: ws.taxInclusivePricing ?? false,
                taxReporting: ws.taxReporting ?? false,
                taxId: ws.taxId ?? '',
                taxType: ws.taxType ?? '',
                country: ws.country ?? 'GT',
            });
            setTaxIdValue(ws.taxId ?? '');
        }
    }, [activeWorkspace]);

    const togglePref = (key: 'taxInclusivePricing' | 'taxReporting') => {
        setPrefs(p => ({ ...p, [key]: !p[key] }));
    };

    const saveAllPrefs = async () => {
        setSavingPrefs(true);
        try {
            const patch = {
                taxInclusivePricing: prefs.taxInclusivePricing,
                taxReporting: prefs.taxReporting,
                taxId: taxIdValue,
                taxType: taxIdValue ? 'nit' : '',
            };
            await api.patch('/workspaces/current', patch);
            setPrefs(p => ({ ...p, ...patch }));
            setPrefsSaved(true);
            setTimeout(() => setPrefsSaved(false), 2500);
        } finally { setSavingPrefs(false); }
    };

    const openCreate = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (tax: WorkspaceTax) => { setEditing(tax); setModalOpen(true); };

    const handleSave = async (form: typeof emptyForm) => {
        const payload = { ...form, rate: parseFloat(form.rate as string) };
        if (editing) {
            await api.patch(`/workspaces/current/taxes/${editing.id}`, payload);
        } else {
            await api.post('/workspaces/current/taxes', payload);
        }
        await load();
    };

    const toggleActive = async (tax: WorkspaceTax) => {
        setTogglingId(tax.id);
        try { await api.patch(`/workspaces/current/taxes/${tax.id}`, { isActive: !tax.isActive }); await load(); }
        finally { setTogglingId(null); }
    };

    const deleteTax = async (tax: WorkspaceTax) => {
        if (!confirm(`${t('taxes.confirmDeletePre')}${tax.label}${t('taxes.confirmDeletePost')}`)) return;
        setDeletingId(tax.id);
        try { await api.delete(`/workspaces/current/taxes/${tax.id}`); await load(); }
        finally { setDeletingId(null); }
    };

    // Get tax identifiers for current country from pais.json
    const countryData = (paisData as any)[prefs.country ?? 'GT'];
    const taxIdentifiers: Array<{ key: string; label: string; placeholder: string; description: string; required: boolean }> =
        countryData?.taxIdentifiers ?? [];

    return (
        <DashboardShell>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold tracking-tight">{t('taxes.title')}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    {t('taxes.titleDesc')}
                </p>
            </div>

            <div className="space-y-6 max-w-3xl">

                {/* ── Preferencias + Información fiscal ────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TagIcon className="h-5 w-5 text-zinc-500" />
                            {t('taxes.taxPrefs')}
                        </CardTitle>
                        <CardDescription>
                            {t('taxes.taxPrefsDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Tax Inclusive Pricing */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="tax-inclusive" className="text-sm font-medium">
                                    {t('taxes.inclusivePricing')}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {t('taxes.inclusiveDesc')}
                                </p>
                            </div>
                            <Switch
                                id="tax-inclusive"
                                checked={prefs.taxInclusivePricing}
                                onCheckedChange={() => togglePref('taxInclusivePricing')}
                                disabled={savingPrefs}
                            />
                        </div>

                        <div className="border-t border-border/40" />

                        {/* Tax Reporting */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="tax-reporting" className="text-sm font-medium">
                                    {t('taxes.taxReporting')}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {t('taxes.taxReportingDesc')}
                                </p>
                            </div>
                            <Switch
                                id="tax-reporting"
                                checked={prefs.taxReporting}
                                onCheckedChange={() => togglePref('taxReporting')}
                                disabled={savingPrefs}
                            />
                        </div>

                        {/* ── Información fiscal (inline) ─────────────── */}
                        {taxIdentifiers.length > 0 && (
                            <>
                                <div className="border-t border-border/40" />
                                <div className="flex items-center gap-2 mb-1">
                                    <Building2 className="h-4 w-4 text-zinc-500" />
                                    <p className="text-sm font-medium">{t('taxes.taxInfo')}</p>
                                </div>
                                <p className="text-xs text-muted-foreground -mt-1 mb-3">
                                    {t('taxes.taxInfoDesc')}
                                </p>
                                <div className="space-y-4">
                                    {taxIdentifiers.map((identifier) => (
                                        <div key={identifier.key}>
                                            <Label className="mb-1.5 block">
                                                {identifier.label}
                                                {!identifier.required && <span className="text-muted-foreground font-normal ml-1">{t('taxes.optional')}</span>}
                                            </Label>
                                            <AppInput
                                                placeholder={identifier.placeholder}
                                                value={identifier.key === 'nit' ? taxIdValue : ''}
                                                onChange={(e) => {
                                                    if (identifier.key === 'nit') setTaxIdValue(e.target.value);
                                                }}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">{identifier.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                    <CardFooter className="justify-between border-t border-border/40 pt-6">
                        <p className="text-xs text-muted-foreground">
                            {prefsSaved
                                ? <span className="text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> {t('taxes.saved')}</span>
                                : t('taxes.savePrompt')}
                        </p>
                        <PrimaryButton compact onClick={saveAllPrefs} disabled={savingPrefs}>
                            {savingPrefs
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('taxes.saving')}</>
                                : t('taxes.saveChanges')}
                        </PrimaryButton>
                    </CardFooter>
                </Card>

                {/* ── Tasas de impuestos ───────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-zinc-500" />
                                    {t('taxes.taxRates')}
                                </CardTitle>
                                <CardDescription className="mt-1.5">
                                    {t('taxes.taxRatesDesc')}
                                </CardDescription>
                            </div>
                            <PrimaryButton compact onClick={openCreate} className="shrink-0">
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                {t('taxes.add')}
                            </PrimaryButton>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {t('taxes.loading')}
                            </div>
                        ) : taxes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center rounded-lg border border-dashed border-border/60">
                                <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mb-3">
                                    <Percent className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium text-foreground mb-1">{t('taxes.noTaxes')}</p>
                                <p className="text-xs text-muted-foreground max-w-xs">{t('taxes.addTaxesInfo')}</p>
                                <button onClick={openCreate} className="mt-4 text-sm font-medium text-foreground underline underline-offset-2 hover:no-underline transition">
                                    {t('taxes.addFirst')}
                                </button>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-border/50 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border/40 bg-muted/40">
                                            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('taxes.thName')}</th>
                                            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('taxes.thRate')}</th>
                                            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('taxes.thAppliesTo')}</th>
                                            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('taxes.thStatus')}</th>
                                            <th className="px-4 py-2.5" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {taxes.map(tax => (
                                            <tr key={tax.id} className={`group border-b border-border/30 last:border-0 transition-colors ${tax.isActive ? 'hover:bg-muted/20' : 'opacity-50'}`}>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-foreground">{tax.label}</span>
                                                        {tax.isDefault && (
                                                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                                                <CheckCircle2 className="w-3 h-3" /> {t('taxes.badgeDefault')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {tax.description && (
                                                        <p className="text-xs text-muted-foreground mt-0.5 max-w-[260px] truncate">{tax.description}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="font-mono font-medium text-foreground">
                                                        {(Number(tax.rate) * 100).toFixed(2).replace(/\.00$/, '')}%
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-muted-foreground text-xs">{t(APPLIES_TO_LABELS[tax.appliesTo])}</td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={tax.isActive}
                                                            onCheckedChange={() => toggleActive(tax)}
                                                            disabled={togglingId === tax.id}
                                                        />
                                                        <span className={`text-xs font-medium ${tax.isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                            {tax.isActive ? t('taxes.statusActive') : t('taxes.statusInactive')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                            onClick={() => openEdit(tax)}
                                                            title={t('taxes.btnEdit')}
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                            onClick={() => deleteTax(tax)}
                                                            disabled={deletingId === tax.id}
                                                            title={t('taxes.btnDelete')}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>

            <TaxModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} initial={editing} />
        </DashboardShell>
    );
}
