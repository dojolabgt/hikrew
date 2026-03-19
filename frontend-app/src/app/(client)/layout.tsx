'use client';

import { useRequireClientMembership } from '@/features/auth/hooks/useRequireRole';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, ChevronDown, LayoutDashboard, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function ClientNav() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const hasOwnerWorkspace = user?.workspaceMembers?.some(
        (wm) => wm.role === 'owner' || wm.role === 'collaborator',
    );

    const initials = user
        ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || user.email[0].toUpperCase()
        : '?';

    const fullName = user
        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email
        : '';

    return (
        <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

                {/* Brand */}
                <Link href="/portal" className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
                        <LayoutDashboard className="h-3.5 w-3.5 text-white dark:text-zinc-900" />
                    </div>
                    <span className="text-sm font-semibold tracking-tight">Portal de cliente</span>
                </Link>

                {/* User menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2 h-9 px-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px] font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium hidden sm:block max-w-[140px] truncate">
                                {fullName}
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 text-zinc-400 hidden sm:block" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <div className="px-3 py-2">
                            <p className="text-xs font-medium truncate">{fullName}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                        <DropdownMenuSeparator />
                        {hasOwnerWorkspace && (
                            <DropdownMenuItem
                                onClick={() => router.push('/dashboard')}
                                className="cursor-pointer"
                            >
                                <Briefcase className="mr-2 h-4 w-4" />
                                Ir a mi dashboard
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            onClick={logout}
                            className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Cerrar sesión
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { isAuthorized, isLoading } = useRequireClientMembership();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
            <ClientNav />
            <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {children}
            </main>
        </div>
    );
}
