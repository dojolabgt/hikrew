'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Loader2, Briefcase, LayoutDashboard } from 'lucide-react';

export default function SelectContextPage() {
    const router = useRouter();
    const { user, isLoading, switchWorkspace, logout } = useAuth();

    const ownerMemberships =
        user?.workspaceMembers?.filter(
            (wm) => wm.role === 'owner' || wm.role === 'collaborator',
        ) ?? [];
    const clientMemberships =
        user?.workspaceMembers?.filter((wm) => wm.role === 'client') ?? [];

    // Redirect away if user doesn't actually have both roles
    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        if (ownerMemberships.length === 0 && clientMemberships.length === 0) {
            router.replace('/login');
        } else if (ownerMemberships.length === 0) {
            router.replace('/portal');
        } else if (clientMemberships.length === 0) {
            router.replace('/dashboard');
        }
    }, [isLoading, user]); // eslint-disable-line react-hooks/exhaustive-deps

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
            </div>
        );
    }

    const handleGoToDashboard = (workspaceId: string) => {
        switchWorkspace(workspaceId);
        router.push('/dashboard');
    };

    const handleGoToPortal = () => {
        router.push('/portal');
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold tracking-tight">¿Cómo quieres entrar?</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Tienes acceso a múltiples espacios. Elige con cuál continuar.
                    </p>
                </div>

                <div className="space-y-3">
                    {ownerMemberships.map((wm) => (
                        <button
                            key={wm.workspaceId}
                            onClick={() => handleGoToDashboard(wm.workspaceId)}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm transition-all text-left"
                        >
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
                                <LayoutDashboard className="h-5 w-5 text-white dark:text-zinc-900" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{wm.workspace.businessName}</p>
                                <p className="text-xs text-muted-foreground capitalize">{wm.role}</p>
                            </div>
                        </button>
                    ))}

                    {clientMemberships.map((wm) => (
                        <button
                            key={wm.workspaceId}
                            onClick={handleGoToPortal}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm transition-all text-left"
                        >
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                    Portal de {wm.workspace.businessName}
                                </p>
                                <p className="text-xs text-muted-foreground">Cliente</p>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-6 text-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        onClick={logout}
                    >
                        Cerrar sesión
                    </Button>
                </div>
            </div>
        </div>
    );
}
