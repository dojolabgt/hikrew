'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { clientsApi } from '@/features/clients/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Lock, UserCheck } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InviteData {
    clientName: string;
    email: string;
    hasAccount: boolean;
    hasPassword: boolean;
    workspace: { businessName?: string; logo?: string };
}

type PageState = 'loading' | 'error' | 'confirm' | 'login' | 'register' | 'success';

// ─── Workspace branding header ─────────────────────────────────────────────────

function WorkspaceHeader({ invite }: { invite: InviteData }) {
    const logo = invite.workspace.logo ? getImageUrl(invite.workspace.logo) : null;
    const workspaceName = invite.workspace.businessName || 'tu freelancer';
    return (
        <div className="text-center space-y-3">
            {logo ? (
                <div className="flex justify-center">
                    <Image src={logo} alt={workspaceName} width={48} height={48} className="rounded-xl object-contain" />
                </div>
            ) : (
                <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                        <Lock className="h-5 w-5 text-zinc-400" />
                    </div>
                </div>
            )}
            <p className="text-xs text-zinc-400 uppercase tracking-widest">{workspaceName}</p>
        </div>
    );
}

// ─── Inner component ──────────────────────────────────────────────────────────

function ClientInviteContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const { user, isLoading: authLoading, checkAuth } = useAuth();

    const [pageState, setPageState] = useState<PageState>('loading');
    const fetchedRef = useRef(false);
    const [invite, setInvite] = useState<InviteData | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [fieldError, setFieldError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Register form
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Login form
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPwd, setShowLoginPwd] = useState(false);

    useEffect(() => {
        if (!token) {
            setErrorMsg('Token de invitación no encontrado.');
            setPageState('error');
            return;
        }

        // Wait until auth is fully resolved so we read the correct user state
        if (authLoading) return;

        // Only fetch once — checkAuth() later changes authLoading again and would re-trigger
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        clientsApi.getInvite(token)
            .then((data) => {
                setInvite(data);
                // Determine initial state based on auth + account existence
                if (user) {
                    // Already logged in — just confirm
                    setPageState('confirm');
                } else if (data.hasAccount) {
                    // Has account but not logged in — show login
                    setPageState('login');
                } else {
                    // New user — show registration
                    setPageState('register');
                }
            })
            .catch((err: { response?: { data?: { message?: string } } }) => {
                setErrorMsg(err.response?.data?.message || 'Invitación inválida o expirada.');
                setPageState('error');
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, authLoading]);

    // ── Accept for already-logged-in user ─────────────────────────────────────

    const handleConfirm = async () => {
        setIsSubmitting(true);
        setFieldError(null);
        try {
            await api.post(`/clients/invite/${token}/accept-authenticated`);
            await checkAuth();
            setPageState('success');
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            setFieldError(apiErr.response?.data?.message || 'No se pudo aceptar la invitación.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Login then accept ──────────────────────────────────────────────────────

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldError(null);
        setIsSubmitting(true);
        try {
            await api.post('/auth/login', { email: invite!.email, password: loginPassword });
            // Now accept with authenticated endpoint
            await api.post(`/clients/invite/${token}/accept-authenticated`);
            await checkAuth();
            setPageState('success');
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            setFieldError(apiErr.response?.data?.message || 'Credenciales incorrectas.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Register then accept ───────────────────────────────────────────────────

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldError(null);
        if (password.length < 8) { setFieldError('La contraseña debe tener al menos 8 caracteres.'); return; }
        if (password !== confirm) { setFieldError('Las contraseñas no coinciden.'); return; }

        setIsSubmitting(true);
        try {
            await clientsApi.acceptInvite(token!, password);
            setPageState('success');
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            setFieldError(apiErr.response?.data?.message || 'Error al crear la cuenta.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── States ───────────────────────────────────────────────────────────────

    if (pageState === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (pageState === 'error') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
                <div className="w-full max-w-sm text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
                        <AlertCircle className="h-7 w-7 text-red-500" />
                    </div>
                    <h1 className="text-xl font-semibold tracking-tight">Invitación no válida</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{errorMsg}</p>
                    <Button variant="outline" className="rounded-full" onClick={() => router.push('/')}>
                        Ir al inicio
                    </Button>
                </div>
            </div>
        );
    }

    if (pageState === 'success') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
                <div className="w-full max-w-sm text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-7 w-7 text-green-500" />
                    </div>
                    <h1 className="text-xl font-semibold tracking-tight">¡Invitación aceptada!</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Ya tienes acceso al portal de <strong>{invite?.workspace.businessName}</strong>.
                    </p>
                    <Button
                        className="w-full rounded-full"
                        onClick={() => user ? router.push('/portal') : router.push(`/login?email=${encodeURIComponent(invite?.email ?? '')}`)}
                    >
                        {user ? 'Ir al portal' : 'Iniciar sesión'}
                    </Button>
                </div>
            </div>
        );
    }

    const workspaceName = invite?.workspace.businessName || 'tu freelancer';

    // ── Confirm (already logged in) ───────────────────────────────────────────

    if (pageState === 'confirm') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
                <div className="w-full max-w-sm space-y-6">
                    {invite && <WorkspaceHeader invite={invite} />}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-5 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto">
                            <UserCheck className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold tracking-tight">Invitación de {workspaceName}</h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                Te invitan a acceder al portal de clientes como <strong>{user?.email}</strong>.
                            </p>
                        </div>
                        {fieldError && (
                            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/[0.07] border border-red-500/[0.15] text-left">
                                <AlertCircle className="h-4 w-4 text-red-400/70 mt-0.5 shrink-0" />
                                <p className="text-[13px] text-red-400 leading-snug">{fieldError}</p>
                            </div>
                        )}
                        <Button
                            className="w-full rounded-xl h-11"
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Aceptar invitación
                        </Button>
                        <p className="text-xs text-zinc-400">
                            ¿No eres {user?.email}?{' '}
                            <button className="underline" onClick={() => setPageState('login')}>
                                Usa otra cuenta
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Login (has account, not logged in) ────────────────────────────────────

    if (pageState === 'login') {
        const googleLoginUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/google?inviteToken=${token}`;

        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
                <div className="w-full max-w-sm space-y-6">
                    {invite && <WorkspaceHeader invite={invite} />}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                        <h1 className="text-xl font-bold tracking-tight mb-1">Inicia sesión para aceptar</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
                            <strong>{workspaceName}</strong> te ha invitado. Tu correo ya tiene una cuenta.
                        </p>

                        {/* Google-only account */}
                        {!invite?.hasPassword ? (
                            <div className="space-y-4">
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Tu cuenta se creó con Google. Inicia sesión para continuar.
                                </p>
                                {fieldError && (
                                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/[0.07] border border-red-500/[0.15]">
                                        <AlertCircle className="h-4 w-4 text-red-400/70 mt-0.5 shrink-0" />
                                        <p className="text-[13px] text-red-400 leading-snug">{fieldError}</p>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => { window.location.href = googleLoginUrl; }}
                                    className="w-full h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[13px] font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2.5"
                                >
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continuar con Google
                                </button>
                            </div>
                        ) : (
                            /* Password account */
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
                                    <Input value={invite?.email ?? ''} readOnly className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 cursor-default" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Contraseña</label>
                                    <div className="relative">
                                        <Input
                                            type={showLoginPwd ? 'text' : 'password'}
                                            placeholder="Tu contraseña"
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                            className="rounded-xl pr-10"
                                            autoFocus
                                            required
                                        />
                                        <button type="button" onClick={() => setShowLoginPwd(v => !v)}
                                            className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors" tabIndex={-1}>
                                            {showLoginPwd ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                {fieldError && (
                                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/[0.07] border border-red-500/[0.15]">
                                        <AlertCircle className="h-4 w-4 text-red-400/70 mt-0.5 shrink-0" />
                                        <p className="text-[13px] text-red-400 leading-snug">{fieldError}</p>
                                    </div>
                                )}
                                <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11">
                                    {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Aceptando...</> : 'Iniciar sesión y aceptar'}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Register (new user) ───────────────────────────────────────────────────

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <div className="w-full max-w-sm space-y-6">
                {invite && <WorkspaceHeader invite={invite} />}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Hola, {invite?.clientName?.split(' ')[0] ?? 'cliente'}
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Crea una contraseña para acceder al portal de <strong>{workspaceName}</strong>.
                    </p>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
                        <Input value={invite?.email ?? ''} readOnly className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 cursor-default" />
                    </div>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Contraseña</label>
                            <div className="relative">
                                <Input type={showPwd ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="rounded-xl pr-10" autoComplete="new-password" required />
                                <button type="button" onClick={() => setShowPwd(v => !v)}
                                    className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors" tabIndex={-1}>
                                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Confirmar contraseña</label>
                            <div className="relative">
                                <Input type={showConfirm ? 'text' : 'password'} placeholder="Repite tu contraseña"
                                    value={confirm} onChange={(e) => setConfirm(e.target.value)}
                                    className="rounded-xl pr-10" autoComplete="new-password" required />
                                <button type="button" onClick={() => setShowConfirm(v => !v)}
                                    className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors" tabIndex={-1}>
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        {fieldError && (
                            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/[0.07] border border-red-500/[0.15]">
                                <AlertCircle className="h-4 w-4 text-red-400/70 mt-0.5 shrink-0" />
                                <p className="text-[13px] text-red-400 leading-snug">{fieldError}</p>
                            </div>
                        )}
                        <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11 text-base shadow-sm mt-1">
                            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creando cuenta...</> : 'Crear cuenta y aceptar'}
                        </Button>
                    </form>
                </div>
                <p className="text-center text-xs text-zinc-400">
                    Al crear tu cuenta aceptas los términos de uso del portal de clientes.
                </p>
            </div>
        </div>
    );
}

export default function ClientInvitePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        }>
            <ClientInviteContent />
        </Suspense>
    );
}
