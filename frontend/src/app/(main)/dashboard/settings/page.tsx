"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { User } from "@/types";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { PasswordForm } from "@/features/profile/components/password-form";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get<User>("/auth/me");
                setUser(response.data);
            } catch (error) {
                console.error("Failed to fetch user:", error);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    if (loading || !user) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Configuración de Cuenta</h1>
                <p className="text-muted-foreground dark:text-zinc-400">
                    Gestiona tu información personal y seguridad.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Profile Form */}
                <div className="lg:col-span-2 space-y-6">
                    <ProfileForm user={user} setUser={setUser} />
                </div>

                {/* Right Column: Security Form */}
                <div className="lg:col-span-1 space-y-6">
                    <PasswordForm />
                </div>
            </div>

            {/* Account Metadata Card */}
            <Card className="border-border/60 shadow-sm bg-gray-50/50 dark:bg-zinc-800/30">
                <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row justify-between text-sm text-muted-foreground dark:text-zinc-400 gap-2">
                        <div className="flex gap-2">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">ID de Usuario:</span>
                            <span className="font-mono text-xs bg-gray-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 px-2 py-0.5 rounded">{user.id}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">Rol:</span>
                            <span className="capitalize px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded text-xs font-semibold">{user.role}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
