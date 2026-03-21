'use client';

import React, { useEffect, useState } from 'react';
import { useNetwork } from '@/hooks/use-network';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, UserPlus, Check, Copy, Network, Clock, Mail, Link2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { WorkspaceConnection } from '@/features/network/types';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/utils';

// ─── Connection Card ──────────────────────────────────────────────────────────

function ConnectionCard({
    conn,
    myWorkspaceId,
    t,
}: {
    conn: WorkspaceConnection;
    myWorkspaceId?: string;
    t: (k: string) => string;
}) {
    const partner = conn.inviterWorkspace?.id === myWorkspaceId
        ? conn.inviteeWorkspace
        : conn.inviterWorkspace;

    const initials = partner?.businessName?.substring(0, 2).toUpperCase() || 'NA';
    const since = new Date(conn.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

    return (
        <div className="flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-11 w-11 rounded-xl shrink-0 shadow-sm ring-1 ring-zinc-100 dark:ring-zinc-800">
                    <AvatarImage src={getImageUrl(partner?.logo)} className="object-cover" />
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-sm font-bold">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <p className="font-semibold text-sm text-zinc-900 dark:text-white truncate leading-tight">
                        {partner?.businessName || t('network.unknown')}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{t('network.networkMember')}</p>
                </div>
            </div>

            <div className="mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {t('network.statusConnected')}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                    <CalendarDays className="w-3 h-3" />
                    {since}
                </span>
            </div>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ConnectionSkeleton() {
    return (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded w-2/3" />
                    <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded w-1/3" />
                </div>
            </div>
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between">
                <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded w-1/4" />
                <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded w-1/4" />
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NetworkPage() {
    const { activeWorkspace } = useAuth();
    const { t } = useWorkspaceSettings();
    const { networkData, isLoading, fetchConnections, generateLink, sendInvite } = useNetwork();

    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteTab, setInviteTab] = useState<'email' | 'link'>('email');
    const [inviteEmail, setInviteEmail] = useState('');
    const [generatedLinkToken, setGeneratedLinkToken] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => { fetchConnections(); }, [fetchConnections]);

    const handleGenerateLink = async () => {
        const token = await generateLink();
        if (token) setGeneratedLinkToken(token);
    };

    const handleCopyLink = () => {
        if (!generatedLinkToken) return;
        const link = `${window.location.origin}/invite/connection?token=${generatedLinkToken}`;
        navigator.clipboard.writeText(link);
        toast.success(t('network.toastCopied'));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleCloseModal = () => {
        setIsInviteModalOpen(false);
        setGeneratedLinkToken(null);
        setInviteEmail('');
        setInviteTab('email');
    };

    const handleSendEmailInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await sendInvite(inviteEmail);
        if (ok) { setInviteEmail(''); handleCloseModal(); }
    };

    const activeConnections = networkData.active;
    const pendingConnections = networkData.pendingSent;

    return (
        <DashboardShell>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('network.title')}</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">{t('network.titleDesc')}</p>
                </div>
                <Button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="rounded-full px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t('network.connectBtn')}
                </Button>
            </div>

            {/* Active connections grid */}
            <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {Array.from({ length: 3 }).map((_, i) => <ConnectionSkeleton key={i} />)}
                    </div>
                ) : activeConnections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                            <Network className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold">{t('network.emptyTitle')}</h3>
                        <p className="text-muted-foreground max-w-xs mt-1 mb-6">{t('network.emptyDesc')}</p>
                        <Button variant="outline" className="rounded-full" onClick={() => setIsInviteModalOpen(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            {t('network.emptyBtn')}
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {activeConnections.map((conn) => (
                            <ConnectionCard
                                key={conn.id}
                                conn={conn}
                                myWorkspaceId={activeWorkspace?.id}
                                t={t}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Pending invitations */}
            {pendingConnections.length > 0 && (
                <div className="mt-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                            {t('network.pendingSection')} · {pendingConnections.length}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {pendingConnections.map((conn) => (
                            <div
                                key={conn.id}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                <span className="text-[12px] font-medium text-amber-700 dark:text-amber-400">
                                    {conn.inviteEmail}
                                </span>
                                <span className="text-[11px] text-amber-500/70">
                                    {new Date(conn.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Invite dialog */}
            <Dialog open={isInviteModalOpen} onOpenChange={handleCloseModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('network.inviteModalTitle')}</DialogTitle>
                        <DialogDescription>{t('network.inviteModalDesc')}</DialogDescription>
                    </DialogHeader>

                    <div className="flex gap-1 p-1 bg-muted rounded-lg mt-2">
                        <button
                            onClick={() => setInviteTab('email')}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 text-sm font-medium py-1.5 rounded-md transition-colors',
                                inviteTab === 'email'
                                    ? 'bg-background shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <Mail className="w-3.5 h-3.5" />
                            Por correo
                        </button>
                        <button
                            onClick={() => setInviteTab('link')}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 text-sm font-medium py-1.5 rounded-md transition-colors',
                                inviteTab === 'link'
                                    ? 'bg-background shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <Link2 className="w-3.5 h-3.5" />
                            Por enlace
                        </button>
                    </div>

                    <div className="flex flex-col items-center py-2 space-y-4 w-full">
                        {inviteTab === 'email' ? (
                            <form onSubmit={handleSendEmailInvite} className="w-full space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Envía una invitación directa al correo del freelancer o agencia con quien quieres conectarte.
                                </p>
                                <Input
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Enviar invitación
                                </Button>
                            </form>
                        ) : (
                            <>
                                {!generatedLinkToken ? (
                                    <>
                                        <p className="text-sm text-center text-muted-foreground w-4/5">
                                            {t('network.inviteExplain')}
                                        </p>
                                        <Button onClick={handleGenerateLink} disabled={isLoading} className="mt-2">
                                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {t('network.generateBtn')}
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center space-y-4 animate-in fade-in duration-300 w-full">
                                        <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
                                            <QRCodeSVG
                                                value={`${window.location.origin}/invite/connection?token=${generatedLinkToken}`}
                                                size={180}
                                                level="Q"
                                                includeMargin={false}
                                                fgColor="#000000"
                                                bgColor="#ffffff"
                                            />
                                        </div>
                                        <div className="flex gap-2 w-full">
                                            <Input
                                                readOnly
                                                value={`${window.location.origin}/invite/connection?token=${generatedLinkToken}`}
                                                className="font-mono text-xs text-muted-foreground"
                                            />
                                            <Button variant="secondary" onClick={handleCopyLink} className="w-28 shrink-0">
                                                {isCopied
                                                    ? <><Check className="w-4 h-4 mr-1.5" />{t('network.copiedBtn')}</>
                                                    : <><Copy className="w-4 h-4 mr-1.5" />{t('network.copyBtn')}</>
                                                }
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center">
                                            {t('network.qrNote')}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardShell>
    );
}
