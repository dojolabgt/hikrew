'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AuthInput } from '@/components/common/AuthInput';
import api from '@/lib/api';

const PUBLIC_URL = process.env.NEXT_PUBLIC_PUBLIC_URL || '/';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
        } catch {
            setError('Ocurrió un error. Inténtalo de nuevo.');
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

                        {sent ? (
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                                </div>
                                <h1 className="text-[24px] font-black tracking-tight text-white leading-tight mb-2">
                                    Revisa tu correo
                                </h1>
                                <p className="text-[14px] text-white/40 mb-8 leading-relaxed">
                                    Si existe una cuenta con <span className="text-white/60">{email}</span>, recibirás un enlace para restablecer tu contraseña.
                                </p>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white transition-colors"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Volver al inicio de sesión
                                </Link>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-[26px] font-black tracking-tight text-white leading-tight mb-1.5">
                                    ¿Olvidaste tu contraseña?
                                </h1>
                                <p className="text-[14px] text-white/40 mb-8">
                                    Ingresa tu correo y te enviaremos un enlace para recuperarla.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-3">
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

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-11 rounded-xl bg-white text-gray-900 text-[14px] font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 mt-1"
                                    >
                                        {isLoading ? 'Enviando...' : 'Enviar enlace'}
                                    </button>
                                </form>

                                <p className="text-center text-[13px] text-white/35 mt-6">
                                    <Link href="/login" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white transition-colors">
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                        Volver al inicio de sesión
                                    </Link>
                                </p>
                            </>
                        )}
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
                            Recupera<br />
                            <span className="text-white/30">tu acceso.</span>
                        </h2>
                        <p className="text-[13px] text-white/35 leading-relaxed">
                            Te enviaremos un enlace seguro para que puedas crear una nueva contraseña.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
