'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthInput } from '@/components/common/AuthInput';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { UserRole } from '@/types';

const PUBLIC_URL = process.env.NEXT_PUBLIC_PUBLIC_URL || '/';

function getDashboardRoute(role: UserRole): string {
    switch (role) {
        case UserRole.ADMIN:
        case UserRole.SUPPORT:
            return '/admin';
        case UserRole.FREELANCER:
            return '/dashboard';
        case UserRole.CLIENT:
            return '/portal';
        default:
            return '/dashboard';
    }
}

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, isLoading, error, user } = useAuth();

    const [email, setEmail] = useState(searchParams.get('email') ?? '');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const callbackUrl = searchParams.get('callbackUrl');

    useEffect(() => {
        if (!isLoading && user) {
            router.replace(callbackUrl || getDashboardRoute(user.role));
        }
    }, [isLoading, user, router, callbackUrl]);

    useEffect(() => {
        const err = searchParams.get('error');
        if (err === 'google_auth_failed') {
            toast.error('No se pudo iniciar sesión con Google. Intenta de nuevo.');
        } else if (err === 'google_no_account') {
            toast.error('No hay ninguna cuenta registrada con ese Google. Regístrate primero.');
        }
        if (err) {
            const url = new URL(window.location.href);
            url.searchParams.delete('error');
            window.history.replaceState({}, '', url.toString());
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isLoading || user) return null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({ email, password });
        } catch (err) {
            console.error('Error al iniciar sesión', err);
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
                            Bienvenido de nuevo.
                        </h1>
                        <p className="text-[14px] text-white/40 mb-8">
                            Ingresa tus datos para continuar.
                        </p>

                        <form onSubmit={handleLogin} className="space-y-3">
                            {error && (
                                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-red-500/[0.07] border border-red-500/[0.15] animate-in fade-in slide-in-from-top-1 duration-200">
                                    <AlertCircle className="h-4 w-4 text-red-400/70 mt-0.5 shrink-0" />
                                    <p className="text-[13px] text-red-300/80 leading-snug">{error}</p>
                                </div>
                            )}

                            <AuthInput
                                type="email"
                                placeholder="Correo electrónico"
                                icon={<Mail className="h-4 w-4" />}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/40 focus-visible:ring-white/20 dark:bg-white/[0.06] dark:border-white/[0.12]"
                            />

                            <AuthInput
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Contraseña"
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

                            <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="remember"
                                        className="rounded-[4px] border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
                                    />
                                    <Label htmlFor="remember" className="text-[13px] text-white/40 cursor-pointer">
                                        Recordarme
                                    </Label>
                                </div>
                                <Link href="/forgot-password" className="text-[13px] text-white/40 hover:text-white transition-colors">
                                    Olvidé mi contraseña
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 rounded-xl bg-white text-gray-900 text-[14px] font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 mt-1"
                            >
                                {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/[0.08]" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-[#0d0d0d] px-3 text-[11px] text-white/25 uppercase tracking-wider">O continúa con</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google?mode=login_only`; }}
                            className="w-full h-11 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white/55 text-[13px] font-medium hover:bg-white/[0.09] hover:text-white/80 transition-colors flex items-center justify-center gap-2.5"
                        >
                            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continuar con Google
                        </button>

                        <p className="text-center text-[13px] text-white/35 mt-6">
                            ¿No tienes cuenta?{' '}
                            <Link href="/register" className="text-white/60 font-medium hover:text-white transition-colors">
                                Regístrate gratis
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

                    {/* Ambient glows */}
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
                            Cotiza mejor.<br />
                            <span className="text-white/30">Cobra más rápido.</span>
                        </h2>

                        <p className="text-[13px] text-white/35 leading-relaxed mb-10">
                            La plataforma de gestión para freelancers y agencias de Centroamérica.
                        </p>

                        <div className="inline-flex items-center gap-2 border border-white/[0.08] rounded-full px-4 py-2">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                            </span>
                            <span className="text-[11px] text-white/35">Plan gratis para siempre</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0d0d0d]" />}>
            <LoginContent />
        </Suspense>
    );
}
