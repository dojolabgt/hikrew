'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AuthInput } from '@/components/common/AuthInput';
import api from '@/lib/api';

const PUBLIC_URL = process.env.NEXT_PUBLIC_PUBLIC_URL || '/';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!token) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#0d0d0d] font-sans">
                <div className="text-center max-w-[340px] px-6">
                    <p className="text-[15px] text-white/50 mb-4">Este enlace es inválido o ha expirado.</p>
                    <Link href="/forgot-password" className="text-[13px] text-white/40 hover:text-white transition-colors underline underline-offset-4">
                        Solicitar un nuevo enlace
                    </Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', { token, newPassword: password });
            toast.success('Contraseña actualizada. Ya puedes iniciar sesión.');
            router.push('/login');
        } catch {
            setError('El enlace es inválido o ha expirado. Solicita uno nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#0d0d0d] font-sans">

            {/* ── Left: Form ── */}
            <div className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 lg:p-16">

                {/* Logo + back link */}
                <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2.5">
                        <Image src="/HiKrewLogo.png" alt="Hi Krew" width={24} height={24} className="object-contain opacity-90" />
                        <span className="font-bold text-[15px] text-white/80 tracking-tight">Hi Krew</span>
                    </div>
                    <a href={PUBLIC_URL} className="inline-flex items-center gap-1.5 text-[12px] text-white/35 hover:text-white/60 transition-colors">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Volver al sitio
                    </a>
                </div>

                {/* Form */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-full max-w-[380px]">

                        <h1 className="text-[26px] font-black tracking-tight text-white leading-tight mb-1.5">
                            Nueva contraseña
                        </h1>
                        <p className="text-[14px] text-white/40 mb-8">
                            Elige una contraseña segura de al menos 8 caracteres.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            {error && (
                                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-red-500/[0.07] border border-red-500/[0.15] animate-in fade-in slide-in-from-top-1 duration-200">
                                    <AlertCircle className="h-4 w-4 text-red-400/70 mt-0.5 shrink-0" />
                                    <p className="text-[13px] text-red-300/80 leading-snug">{error}</p>
                                </div>
                            )}

                            <AuthInput
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nueva contraseña"
                                icon={<Lock className="h-4 w-4" />}
                                rightElement={
                                    <button
                                        type="button"
                                        className="text-white/30 hover:text-white/60 transition-colors focus:outline-none"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                }
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/40 focus-visible:ring-white/20 dark:bg-white/[0.06] dark:border-white/[0.12]"
                            />

                            <AuthInput
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Confirmar contraseña"
                                icon={<Lock className="h-4 w-4" />}
                                rightElement={
                                    <button
                                        type="button"
                                        className="text-white/30 hover:text-white/60 transition-colors focus:outline-none"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        tabIndex={-1}
                                    >
                                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                }
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/40 focus-visible:ring-white/20 dark:bg-white/[0.06] dark:border-white/[0.12]"
                            />

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 rounded-xl bg-white text-gray-900 text-[14px] font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 mt-1"
                            >
                                {isLoading ? 'Guardando...' : 'Guardar contraseña'}
                            </button>
                        </form>

                        <p className="text-center text-[13px] text-white/35 mt-6">
                            <Link href="/login" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white transition-colors">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Volver al inicio de sesión
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[11px] text-white/20">
                    <span>© {new Date().getFullYear()} Hi Krew · Dojo Lab</span>
                    <div className="flex gap-4">
                        <Link href="/privacidad" className="hover:text-white/40 transition-colors">Privacidad</Link>
                        <Link href="/terminos" className="hover:text-white/40 transition-colors">Términos</Link>
                    </div>
                </div>
            </div>

            {/* ── Right: Brand panel ── */}
            <div className="hidden lg:block lg:w-1/2 p-4 pl-0">
                <div className="w-full h-full rounded-2xl border border-white/[0.06] overflow-hidden relative flex items-center justify-center">
                    <div className="pointer-events-none absolute inset-0"
                        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(255,255,255,0.04) 0%, transparent 70%)' }}
                    />
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-64"
                        style={{ background: 'radial-gradient(ellipse 60% 80% at 30% 100%, rgba(255,255,255,0.015) 0%, transparent 70%)' }}
                    />
                    <div className="relative z-10 max-w-xs text-center px-8">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mx-auto mb-8">
                            <Image src="/HiKrewLogo.png" alt="Hi Krew" width={22} height={22} className="object-contain opacity-80" />
                        </div>
                        <h2 className="text-[32px] font-black text-white tracking-tight leading-[1.05] mb-4">
                            Casi listo.<br />
                            <span className="text-white/30">Nueva clave.</span>
                        </h2>
                        <p className="text-[13px] text-white/35 leading-relaxed">
                            Una vez guardada podrás iniciar sesión con tu nueva contraseña.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0d0d0d]" />}>
            <ResetPasswordContent />
        </Suspense>
    );
}
