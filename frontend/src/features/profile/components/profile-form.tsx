"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Camera, Save, Loader2, User as UserIcon } from "lucide-react";
import { ImageCropperDialog } from "@/components/common/image-cropper-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { User } from "@/types";
import { updateProfile, uploadAvatar, type UpdateProfileDto } from "../services/profile.service";
import api from "@/lib/auth"; // Need to refresh auth/me

const profileSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
    user: User;
    setUser: (user: User) => void;
}

export function ProfileForm({ user, setUser }: ProfileFormProps) {
    const [tempImageForCrop, setTempImageForCrop] = useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user.name,
            email: user.email,
        },
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("La imagen es demasiado grande. Máximo 2MB.");
                e.target.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImageForCrop(reader.result as string);
                setIsCropperOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (croppedImage: string) => {
        try {
            const response = await fetch(croppedImage);
            const blob = await response.blob();
            const file = new File([blob], 'profile-image.jpg', { type: blob.type });

            await uploadAvatar(file);

            // Refresh user data to get new avatar URL
            const res = await api.get<User>("/auth/me");
            setUser(res.data);
            toast.success("Foto de perfil actualizada");
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar la foto");
        }
    };

    const onSubmit = async (data: ProfileFormValues) => {
        try {
            // Only send name for non-admins to avoid 403/400 if backend restricts email
            const updateData: Partial<User> = { name: data.name };
            if (user.role === "admin") {
                updateData.email = data.email;
            }

            await updateProfile(updateData as UpdateProfileDto);

            // Refresh local user data
            const res = await api.get<User>("/auth/me");
            setUser(res.data);
            toast.success("Perfil actualizado correctamente");
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar el perfil");
        }
    };

    const isAdmin = user.role === "admin";

    return (
        <Card className="border-border/60 shadow-sm">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <UserIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle>Información Personal</CardTitle>
                        <CardDescription>Actualiza tus datos básicos</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Photo Upload Section */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-border/50">
                        <div className="relative group">
                            <UserAvatar
                                user={user}
                                size="xl"
                                className="border-4 border-white shadow-md"
                                fallbackClassName="bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600"
                            />
                            <Label
                                htmlFor="picture"
                                className="absolute bottom-0 right-0 p-2 bg-zinc-900 text-white rounded-full cursor-pointer hover:bg-zinc-800 transition-all shadow-lg border-2 border-white"
                            >
                                <Camera className="h-4 w-4" />
                                <Input
                                    id="picture"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </Label>
                        </div>
                        <div className="text-center sm:text-left space-y-1 pt-2">
                            <h3 className="font-medium text-gray-900 dark:text-white">Foto de Perfil</h3>
                            <p className="text-sm text-muted-foreground dark:text-zinc-400 max-w-xs">
                                Sube una imagen para personalizar tu perfil.
                                <br className="hidden sm:block" />
                                Formatos permitidos: JPG, PNG, GIF.
                            </p>
                        </div>
                    </div>

                    {/* Personal Info Form */}
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre Completo</Label>
                                <Input
                                    id="name"
                                    {...form.register("name")}
                                    className="bg-gray-50/50 focus:bg-white transition-all"
                                    placeholder="Tu nombre"
                                />
                                {form.formState.errors.name && (
                                    <p className="text-xs text-red-500 font-medium">{form.formState.errors.name.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input
                                    id="email"
                                    {...form.register("email")}
                                    disabled={!isAdmin}
                                    className="bg-gray-50/50 focus:bg-white transition-all disabled:opacity-70"
                                />
                                {form.formState.errors.email && (
                                    <p className="text-xs text-red-500 font-medium">{form.formState.errors.email.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting || !form.formState.isDirty}
                                className="min-w-[140px]"
                            >
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Guardar Cambios
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Image Cropper Dialog */}
                {tempImageForCrop && (
                    <ImageCropperDialog
                        open={isCropperOpen}
                        onOpenChange={setIsCropperOpen}
                        imageSrc={tempImageForCrop}
                        onCropComplete={handleCropComplete}
                    />
                )}
            </CardContent>
        </Card>
    );
}
