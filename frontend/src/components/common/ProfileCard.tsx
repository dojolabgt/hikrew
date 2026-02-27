'use client';

import Image from 'next/image';

import { createPortal } from 'react-dom';
import { Fingerprint, Lock, Activity, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { UserRole, UserRoleLabels } from '@/lib/types/enums';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/image-utils';

interface ProfileCardProps {
    user: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
        profileImage?: string;
        createdAt: string;
    };
    appName?: string;
    className?: string;
    onClose?: () => void;
    isOpen?: boolean;
}

/**
 * ProfileCard Component
 * 
 * A dark badge/ID card styled profile card with glassmorphism effect.
 * Can be used as a standalone modal with its own close button.
 * Uses React Portal to render at document body level for proper overlay coverage.
 * 
 * @example
 * ```tsx
 * <ProfileCard user={userData} appName="My App" isOpen={true} onClose={() => setOpen(false)} />
 * ```
 */
export function ProfileCard({ user, appName = "DASHBOARD", className, onClose, isOpen = false }: ProfileCardProps) {
    // Format user ID for display (e.g., "abc123" -> "ABC-123")
    const formattedId = user.id.slice(0, 8).toUpperCase().match(/.{1,4}/g)?.join('-') || user.id.toUpperCase();

    // Get role label
    const roleLabel = UserRoleLabels[user.role] || user.role;

    // Get user image for background
    const backgroundImage = (user.profileImage ? getImageUrl(user.profileImage) : undefined)
        || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop';

    if (!isOpen) return null;

    const modalContent = (
        <>
            {/* Backdrop overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Card container */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className={cn(
                        "relative w-[320px] h-[500px] rounded-[20px] overflow-hidden font-sans pointer-events-auto",
                        "bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-950",
                        "shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
                        "backdrop-blur-sm",
                        "animate-in zoom-in-95 duration-200",
                        className
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-colors"
                            aria-label="Cerrar"
                        >
                            <X size={16} className="text-white" />
                        </button>
                    )}

                    {/* Imagen de fondo con glassmorphism */}
                    <Image
                        src={backgroundImage}
                        alt="Profile Background"
                        fill
                        className="object-cover opacity-40 dark:opacity-30"
                        sizes="(max-width: 768px) 100vw, 320px"
                    />

                    {/* Overlay con glassmorphism */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 dark:from-black/40 dark:to-black/80 backdrop-blur-[2px]" />

                    {/* Contenido */}
                    <div className="relative z-10 h-full flex flex-col justify-between p-8 text-white">
                        {/* Header */}
                        <div className="flex justify-between items-center border-b border-white/20 dark:border-white/10 pb-4">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.1em] px-2 py-1 bg-white/10 dark:bg-white/5 rounded border border-white/20 dark:border-white/10 backdrop-blur-sm">
                                <Lock size={14} className="opacity-80" />
                                <span>{appName.toUpperCase()}</span>
                            </div>
                            <Activity className="opacity-80" size={20} />
                        </div>

                        {/* Nombre y título */}
                        <div className="flex-1 flex flex-col justify-end items-center text-center gap-6 mb-8">
                            <div className="text-center space-y-4">
                                <h2 className="text-2xl font-bold tracking-[0.05em] m-0 drop-shadow-lg">
                                    {user.name.toUpperCase()}
                                </h2>
                                <p className="text-xs tracking-[0.2em] opacity-70 m-0 uppercase">
                                    {roleLabel}
                                </p>
                                <div className="flex flex-col gap-1 text-xs opacity-80">
                                    <p className="truncate max-w-[260px]">{user.email}</p>
                                    <p className="text-[10px] opacity-60">
                                        Desde {format(new Date(user.createdAt), "MMM yyyy", { locale: es })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-between items-end border-t border-white/20 dark:border-white/10 pt-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] tracking-[0.1em] opacity-60">ID NUMBER</span>
                                <span className="font-mono text-sm tracking-[0.05em]">{formattedId}</span>
                            </div>
                            <div className="opacity-40">
                                <Fingerprint size={32} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    // Render modal at document body level using portal
    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

export default ProfileCard;