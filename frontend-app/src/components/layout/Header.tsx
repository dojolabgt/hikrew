'use client';

import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LogOut, User as UserIcon, Settings, Menu, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopHeaderProps {
    mobileMenuOpen?: boolean;
    onMobileMenuToggle?: (open: boolean) => void;
}

export function TopHeader({ mobileMenuOpen, onMobileMenuToggle }: TopHeaderProps) {
    const { user, logout, activeWorkspace } = useAuth();
    const router = useRouter();

    if (!user) return null;

    const isProOrPremium = activeWorkspace?.plan === 'pro' || activeWorkspace?.plan === 'premium';
    const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuario';
    const businessName = isProOrPremium
        ? (activeWorkspace?.businessName || userFullName || 'Mi Espacio')
        : (userFullName || 'Usuario');
    const initials = (user.firstName?.[0] || user.email[0]).toUpperCase();

    return (
        <header className="sticky top-0 z-30 hidden md:flex h-14 w-full items-center justify-between px-4 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800/60 shrink-0">
            {/* Mobile left: hamburger + brand name */}
            <div className="flex items-center gap-2.5 md:hidden">
                <button
                    onClick={() => onMobileMenuToggle?.(!mobileMenuOpen)}
                    className="p-1.5 -ml-1 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors"
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <span className="font-semibold text-sm text-zinc-900 dark:text-white truncate max-w-[160px]">
                    {businessName}
                </span>
            </div>

            {/* Desktop left: spacer */}
            <div className="hidden md:block" />

            {/* Right: user dropdown — always visible */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 outline-none rounded-full hover:ring-2 hover:ring-zinc-100 dark:hover:ring-zinc-800 transition-all p-1">
                        <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-700">
                            <AvatarImage src={getImageUrl(user.profileImage)} alt={businessName} className="object-cover" />
                            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold uppercase text-xs">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <span className="hidden md:block text-sm font-medium text-zinc-700 dark:text-zinc-300 max-w-[120px] truncate">
                            {userFullName}
                        </span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-0.5">
                            <p className="text-sm font-medium leading-none">{businessName}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>Mi Perfil</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Integraciones</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={logout}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
