
"use client";

import { login } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils/type-guards";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRateLimit } from "@/hooks/useRateLimit";
import { LOGIN_MAX_ATTEMPTS, LOGIN_RATE_LIMIT_WINDOW, LOGIN_BLOCK_DURATION } from "@/lib/constants";
import Link from "next/link";

const loginSchema = z.object({
    email: z.string().email("Email inválido").min(1, "El email es requerido"),
    password: z.string().min(1, "La contraseña es requerida"),
});

type LoginSchema = z.infer<typeof loginSchema>;

interface LoginFormProps {
    onSuccess?: () => void;
    role?: "user" | "team";
}

export function LoginForm({ onSuccess, role = "user" }: LoginFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { refreshUser } = useAuth();

    // Rate limiting to prevent brute force attacks
    const rateLimit = useRateLimit({
        maxAttempts: LOGIN_MAX_ATTEMPTS,
        windowMs: LOGIN_RATE_LIMIT_WINDOW,
        blockDurationMs: LOGIN_BLOCK_DURATION,
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginSchema) => {
        // Check rate limit before attempting login
        if (!rateLimit.canAttempt()) {
            const remainingSeconds = Math.ceil(rateLimit.getRemainingTime() / 1000);
            toast.error(
                `Demasiados intentos fallidos. Espera ${remainingSeconds} segundos.`,
                { duration: 5000 }
            );
            return;
        }

        setIsLoading(true);
        try {
            const response = await login(data.email, data.password);
            const userRole = response.user.role;

            // Validate Role vs Tab
            if (role === 'user' && userRole !== 'user') {
                rateLimit.recordAttempt();
                throw new Error("No tienes permisos para acceder al portal de Clientes.");
            }
            if (role === 'team' && userRole === 'user') {
                rateLimit.recordAttempt();
                throw new Error("No tienes permisos para acceder al portal del Equipo.");
            }

            // Success - reset rate limit
            rateLimit.reset();
            toast.success(`Bienvenido al portal de ${role === 'user' ? 'Clientes' : 'Equipo'}`);

            // Refresh the auth context with the new user
            await refreshUser();

            // Wait a bit for state to update
            await new Promise(resolve => setTimeout(resolve, 100));

            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Login failed:", error);

            // Record failed attempt for rate limiting
            rateLimit.recordAttempt();

            // Show remaining attempts if getting close to limit
            const remainingAttempts = LOGIN_MAX_ATTEMPTS - rateLimit.attempts;

            let errorMessage = getErrorMessage(error);

            if (remainingAttempts <= 2 && remainingAttempts > 0) {
                errorMessage += ` (${remainingAttempts} intentos restantes)`;
            }

            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="admin@admin.com"
                    {...register("email")}
                    disabled={isLoading}
                />
                {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••"
                    {...register("password")}
                    disabled={isLoading}
                />
                {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="remember"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="remember" className="text-sm font-normal">Recordarme</Label>
                </div>
                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                    ¿Olvidaste tu contraseña?
                </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Entrando..." : "Entrar"}
            </Button>
        </form >
    );
}
