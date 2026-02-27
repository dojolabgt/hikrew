"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/auth";
import { UsersTable } from "@/features/users/components/users-table";

interface User {
    role: string;
}

export default function UsersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get<User>("/auth/me");
                if (response.data.role === "admin") {
                    setAuthorized(true);
                } else {
                    // Not admin, redirect to dashboard
                    router.push("/dashboard");
                }
            } catch {
                // Not authenticated, redirect to login
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <div className="container mx-auto py-10 px-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Verificando permisos...</p>
                </div>
            </div>
        );
    }

    if (!authorized) {
        return null;
    }

    return (
        <div className="h-full">
            <div className="flex flex-col gap-4 mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Gestión de Usuarios</h1>
                <p className="text-muted-foreground dark:text-zinc-400">
                    Administra y gestiona los usuarios del sistema.
                </p>
            </div>

            <UsersTable />
        </div>
    );
}
