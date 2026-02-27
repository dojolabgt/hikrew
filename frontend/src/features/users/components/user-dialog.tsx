"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/common/Dialog";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/common/Select";
import { UpdateUserDto, User, createUser, updateUser } from "@/features/users/services/users-service";
import { toast } from "sonner";

import { UserRole } from "@/lib/types/enums";

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userToEdit?: User | null;
    onSuccess: () => void;
}

export function UserDialog({ open, onOpenChange, userToEdit, onSuccess }: UserDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const isEditing = !!userToEdit;

    const formSchema = z.object({
        name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
        email: z.string().email("Email inválido"),
        role: z.nativeEnum(UserRole),
        password: z.string().optional(),
        confirmPassword: z.string().optional(),
    }).refine((data) => {
        if (!isEditing) {
            // Create mode: Password is required
            if (!data.password) return false;
            return data.password === data.confirmPassword;
        }
        if (showPassword) {
            // Edit mode + Change Password: Password is required
            if (!data.password) return false;
            return data.password === data.confirmPassword;
        }
        return true;
    }, {
        message: "Las contraseñas no coinciden o son requeridas",
        path: ["confirmPassword"],
    });

    type UserFormValues = z.infer<typeof formSchema>;

    // ✅ Removido 'watch' de la desestructuración
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<UserFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            role: UserRole.USER,
        },
    });

    // Reset form when dialog opens/closes or userToEdit changes
    useEffect(() => {
        if (open) {
            setShowPassword(false);
            if (userToEdit) {
                setValue("name", userToEdit.name);
                setValue("email", userToEdit.email);
                setValue("role", userToEdit.role);
                setValue("password", "");
                setValue("confirmPassword", "");
            } else {
                reset({
                    name: "",
                    email: "",
                    role: UserRole.USER,
                    password: "",
                    confirmPassword: "",
                });
            }
        }
    }, [open, userToEdit, setValue, reset]);

    const onSubmit = async (data: UserFormValues) => {
        setIsLoading(true);
        try {
            if (isEditing && userToEdit) {
                const updateData: UpdateUserDto = {
                    name: data.name,
                    role: data.role,
                };

                updateData.email = data.email;

                if (showPassword && data.password) {
                    updateData.password = data.password;
                }

                await updateUser(userToEdit.id, updateData);
                toast.success("Usuario actualizado correctamente");
            } else {
                await createUser({
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    password: data.password!,
                });
                toast.success("Usuario creado correctamente");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Ocurrió un error al guardar el usuario");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Actualiza la información del usuario en el sistema." : "Completa el formulario para registrar un nuevo usuario."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">

                    {/* Grid Layout for Personal Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-zinc-700 dark:text-zinc-300">Nombre Completo</Label>
                            <Input
                                id="name"
                                {...register("name")}
                                placeholder="Ej. Juan Pérez"
                                className="bg-gray-50/50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800 transition-all"
                            />
                            {errors.name && <p className="text-xs font-medium text-red-500 dark:text-red-400 animate-pulse">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">Correo Electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                {...register("email")}
                                placeholder="ejemplo@correo.com"
                                className="bg-gray-50/50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800 transition-all"
                            />
                            {errors.email && <p className="text-xs font-medium text-red-500 dark:text-red-400 animate-pulse">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role" className="text-zinc-700 dark:text-zinc-300">Rol de Usuario</Label>
                            <Select
                                onValueChange={(val) => setValue("role", val as UserRole)}
                                defaultValue={userToEdit?.role || UserRole.USER}
                            >
                                <SelectTrigger className="bg-gray-50/50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800 transition-all">
                                    <SelectValue placeholder="Selecciona un rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={UserRole.ADMIN}>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-indigo-600 dark:text-indigo-400">Administrador</span>
                                            <span className="text-xs text-gray-400 dark:text-zinc-500">- Acceso total</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value={UserRole.TEAM}>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-blue-600 dark:text-blue-400">Equipo</span>
                                            <span className="text-xs text-gray-400 dark:text-zinc-500">- Gestión de contenidos</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value={UserRole.USER}>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-600 dark:text-zinc-400">Usuario</span>
                                            <span className="text-xs text-gray-400 dark:text-zinc-500">- Acceso limitado</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.role && <p className="text-xs font-medium text-red-500 dark:text-red-400 animate-pulse">{errors.role.message}</p>}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">

                        {isEditing && !showPassword && (
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-700">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Contraseña</h4>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400">La contraseña no se muestra por seguridad.</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowPassword(true)}
                                    className="text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
                                >
                                    Cambiar Contraseña
                                </Button>
                            </div>
                        )}

                        {(showPassword || !isEditing) && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-medium text-gray-900 dark:text-white">
                                        {isEditing ? "Nueva Contraseña" : "Contraseña"}
                                    </Label>
                                    {isEditing && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowPassword(false)}
                                            className="h-auto p-0 text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            Cancelar cambio
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300">Contraseña</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            {...register("password")}
                                            placeholder="••••••••"
                                            className="bg-gray-50/50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" className="text-zinc-700 dark:text-zinc-300">Confirmar Contraseña</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            {...register("confirmPassword")}
                                            placeholder="••••••••"
                                            className="bg-gray-50/50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800 transition-all"
                                        />
                                    </div>
                                </div>
                                {(errors.password || errors.confirmPassword) && (
                                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900 flex items-start gap-2">
                                        <svg className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                            {errors.password?.message || errors.confirmPassword?.message || "Las contraseñas no coinciden"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className="h-11 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isLoading}
                            className="h-11 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-gray-100 shadow-lg shadow-zinc-900/20 dark:shadow-white/10 px-8"
                        >
                            {isEditing ? "Guardar Cambios" : "Crear Usuario"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}