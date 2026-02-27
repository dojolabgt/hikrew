"use client";

import { usePathname, useRouter } from "next/navigation";
import { Settings, Bell, Search, LogOut, ChevronDown, User as UserIcon, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/common/UserAvatar";
import api from "@/lib/auth";
import { User } from "@/types";
import { useEffect, useState } from "react";

const pageNames: Record<string, string> = {
    "/dashboard": "Overview",
    "/dashboard/users": "Gestión de Usuarios",
    "/dashboard/settings": "Configuración",
    "/dashboard/app-settings": "App Settings",
};

interface DashboardHeaderProps {
    user?: User | null;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const pageName = pageNames[pathname] || "Dashboard";

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
            router.push("/login");
        } catch (error) {
            console.error("Logout failed:", error);
            router.push("/login");
        }
    };

    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);

        // Sync state with DOM
        if (prefersDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Defer state update to avoid sync setState warning
        const timer = setTimeout(() => setIsDark(prefersDark), 0);
        return () => clearTimeout(timer);
    }, []);

    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        document.documentElement.classList.toggle('dark', newIsDark);
        localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    };

    return (
        <header className="flex flex-row items-center justify-between gap-2 w-full pb-4 border-b border-gray-100/50 dark:border-white/5">
            {/* Title Section */}
            <div>
                <h2 className="text-lg md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white truncate max-w-[200px] md:max-w-none">{pageName}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 hidden md:block">Bienvenido de nuevo a tu panel.</p>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 md:gap-6">
                {/* Search Bar - Hidden on small mobile */}
                <div className="hidden md:flex items-center bg-gray-50 dark:bg-zinc-800/50 rounded-full px-4 py-2 border border-gray-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-zinc-900/10 dark:focus-within:ring-white/10 transition-all w-64">
                    <Search className="h-4 w-4 text-gray-400 dark:text-zinc-500 mr-2" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-gray-700 dark:text-zinc-200"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* Dark Mode Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400"
                        onClick={toggleTheme}
                    >
                        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>

                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                    </Button>

                    {/* User Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="hidden md:flex rounded-full pl-2 pr-4 py-6 hover:bg-gray-100 dark:hover:bg-zinc-800 items-center gap-3">
                                <UserAvatar
                                    user={user}
                                    size="default"
                                    className="h-8 w-8 border border-gray-200 dark:border-zinc-700"
                                    fallbackClassName="bg-zinc-900 text-white"
                                />
                                <div className="hidden md:flex flex-col items-start">
                                    <span className="text-sm font-semibold text-zinc-900 dark:text-white leading-none">{user?.name}</span>
                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize leading-none mt-1">{user?.role}</span>
                                </div>
                                <ChevronDown className="h-3 w-3 text-zinc-400 dark:text-zinc-500 ml-1" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-xl shadow-gray-200/50 dark:shadow-zinc-950/50 border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <DropdownMenuLabel className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider px-3 py-2">
                                Mi Cuenta
                            </DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/settings" className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 focus:bg-gray-50 dark:focus:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                                    <UserIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-zinc-400" />
                                    <span>Perfil</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/settings" className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 focus:bg-gray-50 dark:focus:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                                    <Settings className="mr-2 h-4 w-4 text-gray-500 dark:text-zinc-400" />
                                    <span>Configuración</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-100 dark:bg-zinc-800 my-1" />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 focus:bg-red-50 dark:focus:bg-red-950/50 text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 mt-1"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Cerrar Sesión</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
