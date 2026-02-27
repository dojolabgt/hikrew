"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { changePassword } from "../services/profile.service";

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "La contraseña actual es requerida"),
    newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres")
        .regex(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, "Debe contener mayúscula, minúscula y número/símbolo"),
    confirmPassword: z.string().min(1, "Confirma tu nueva contraseña"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function PasswordForm() {
    const form = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
    });

    const onSubmit = async (data: PasswordFormValues) => {
        try {
            await changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            toast.success("Contraseña actualizada correctamente");
            form.reset();
        } catch (error) {
            console.error(error);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            if (err.response?.data?.message === "Invalid current password") {
                form.setError("currentPassword", {
                    type: "manual",
                    message: "La contraseña actual es incorrecta"
                });
            } else {
                toast.error(err.response?.data?.message || "Error al cambiar la contraseña");
            }
        }
    };

    return (
        <Card className="border-border/60 shadow-sm h-full">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                        <Lock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                        <CardTitle>Seguridad</CardTitle>
                        <CardDescription>Actualiza tu contraseña</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Contraseña Actual</Label>
                        <Input
                            id="currentPassword"
                            type="password"
                            {...form.register("currentPassword")}
                            className="bg-gray-50/50 focus:bg-white"
                            placeholder="••••••••"
                        />
                        {form.formState.errors.currentPassword && (
                            <p className="text-xs text-red-500 font-medium">{form.formState.errors.currentPassword.message}</p>
                        )}
                    </div>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            {...form.register("newPassword")}
                            className="bg-gray-50/50 focus:bg-white"
                            placeholder="••••••••"
                        />
                        {form.formState.errors.newPassword && (
                            <p className="text-xs text-red-500 font-medium">{form.formState.errors.newPassword.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            {...form.register("confirmPassword")}
                            className="bg-gray-50/50 focus:bg-white"
                            placeholder="••••••••"
                        />
                        {form.formState.errors.confirmPassword && (
                            <p className="text-xs text-red-500 font-medium">{form.formState.errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        variant="outline"
                        className="w-full mt-2"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Actualizar Contraseña"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
