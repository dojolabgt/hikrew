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
import { Loader2, UserPlus, Check, Copy, Network, Clock, Mail, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { WorkspaceConnection } from '@/features/network/types';

export default function NetworkPage() {
    const { activeWorkspace } = useAuth();
    const { t } = useWorkspaceSettings();
    const {
        networkData,
        isLoading,
        fetchConnections,
        generateLink,
        sendInvite,
    } = useNetwork();

    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteTab, setInviteTab] = useState<'email' | 'link'>('email');
    const [inviteEmail, setInviteEmail] = useState('');
    const [generatedLinkToken, setGeneratedLinkToken] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    const handleGenerateLink = async () => {
        const token = await generateLink();
        if (token) {
            setGeneratedLinkToken(token);
        }
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
        if (ok) {
            setInviteEmail('');
            handleCloseModal();
        }
    };

    const columns: ColumnDef<WorkspaceConnection>[] = [
        {
            key: 'conexion',
            header: t('network.colConnection'),
            render: (conn) => {
                const partner = conn.inviterWorkspace?.id === activeWorkspace?.id
                    ? conn.inviteeWorkspace
                    : conn.inviterWorkspace;

                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border-2 border-background shadow-sm shrink-0">
                            <AvatarImage src={partner?.logo || undefined} alt={partner?.businessName} className="object-cover" />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                {partner?.businessName?.substring(0, 2).toUpperCase() || 'NA'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-semibold group-hover:text-primary transition-colors">
                                {partner?.businessName || t('network.unknown')}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-xs text-muted-foreground">
                                    {t('network.networkMember')}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'status',
            header: t('network.colStatus'),
            render: () => (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                    {t('network.statusConnected')}
                </span>
            ),
        },
        {
            key: 'createdAt',
            header: t('network.colDate'),
            render: (conn) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(conn.createdAt).toLocaleDateString('es-GT')}
                </span>
            ),
        },
    ];

    return (
        <DashboardShell>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('network.title')}</h1>
                    <p className="text-muted-foreground">{t('network.titleDesc')}</p>
                </div>
                <Button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="relative z-10 rounded-full px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t('network.connectBtn')}
                </Button>
            </div>

            <DataTable
                data={networkData.active}
                columns={columns}
                isLoading={isLoading}
                emptyIcon={<Network className="w-8 h-8" />}
                emptyTitle={t('network.emptyTitle')}
                emptyDescription={t('network.emptyDesc')}
                emptyAction={
                    <Button variant="outline" className="rounded-full" onClick={() => setIsInviteModalOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        {t('network.emptyBtn')}
                    </Button>
                }
            />

            {networkData.pendingSent.length > 0 && (
                <div className="mt-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {t('network.pendingSection')} ({networkData.pendingSent.length})
                        </h2>
                    </div>
                    <div className="rounded-xl border border-border divide-y divide-border">
                        {networkData.pendingSent.map((conn) => (
                            <div key={conn.id} className="flex items-center justify-between px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium">{conn.inviteEmail}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {new Date(conn.createdAt).toLocaleDateString('es-GT')}
                                    </p>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                                    {t('network.statusPending')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Dialog open={isInviteModalOpen} onOpenChange={handleCloseModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('network.inviteModalTitle')}</DialogTitle>
                        <DialogDescription>{t('network.inviteModalDesc')}</DialogDescription>
                    </DialogHeader>

                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-muted rounded-lg mt-2">
                        <button
                            onClick={() => setInviteTab('email')}
                            className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-1.5 rounded-md transition-colors ${inviteTab === 'email' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Mail className="w-3.5 h-3.5" />
                            Por correo
                        </button>
                        <button
                            onClick={() => setInviteTab('link')}
                            className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-1.5 rounded-md transition-colors ${inviteTab === 'link' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
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
                                        <Button onClick={handleGenerateLink} disabled={isLoading} className="mt-2 text-md">
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
                                        <div className="flex gap-2 w-full mt-4">
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

