'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthInput } from '@/components/common/AuthInput';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, AlertCircle, Send, Zap, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import Link from 'next/link';
import { UserRole } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PUBLIC_URL = process.env.NEXT_PUBLIC_PUBLIC_URL || '/';
const ENABLE_REGISTER = process.env.NEXT_PUBLIC_ENABLE_REGISTER === 'true';

// ─── Beta Application Modal ────────────────────────────────────────────────────

const ROLES = [
    { value: 'freelancer', label: 'Freelancer independiente' },
    { value: 'agency', label: 'Agencia o estudio' },
    { value: 'creative', label: 'Creativo / Diseñador' },
    { value: 'dev', label: 'Desarrollador' },
    { value: 'other', label: 'Otro' },
];

const CLIENT_VOLUMES = [
    { value: '1-3', label: '1 – 3 clientes activos' },
    { value: '4-10', label: '4 – 10 clientes activos' },
    { value: '11-30', label: '11 – 30 clientes activos' },
    { value: '30+', label: 'Más de 30 clientes' },
];

function BetaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        name: '',
        email: '',
        role: '',
        motivation: '',
        clientVolume: '',
        acceptErrors: false,
        acceptFeedback: false,
    });

    const set = (key: keyof typeof form, value: string | boolean) =>
        setForm((f) => ({ ...f, [key]: value }));

    const canNext1 = form.name.trim() && form.email.trim() && form.role;
    const canNext2 = form.motivation.trim().length >= 20 && form.clientVolume;
    const canSubmit = form.acceptErrors && form.acceptFeedback;

    const handleSubmit = () => setStep(4);

    const inputCls = 'w-full h-10 rounded-xl bg-white/[0.06] border border-white/[0.12] text-white placeholder:text-white/30 text-[13px] px-3.5 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors';

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="bg-[#111111] border border-white/[0.08] text-white p-0 max-w-md rounded-2xl overflow-hidden shadow-2xl [&>button]:text-white/30 [&>button]:hover:text-white/60">
                <VisuallyHidden.Root><DialogTitle>Solicitar acceso a la Beta</DialogTitle></VisuallyHidden.Root>

                {/* Progress bar */}
                {step < 4 && (
                    <div className="h-0.5 bg-white/[0.06] w-full">
                        <div
                            className="h-full bg-white/30 transition-all duration-500"
                            style={{ width: `${((step - 1) / 3) * 100}%` }}
                        />
                    </div>
                )}

                <div className="p-6">

                    {/* ── Step 1: Sobre ti ── */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div>
                                <div className="text-[11px] text-white/30 uppercase tracking-wider mb-3">Paso 1 de 3</div>
                                <h2 className="text-[20px] font-black text-white tracking-tight leading-tight">Cuéntanos sobre ti.</h2>
                                <p className="text-[13px] text-white/40 mt-1">Queremos conocer quién eres antes de darte acceso.</p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[11px] text-white/35 uppercase tracking-wider block mb-1.5">Nombre completo</label>
                                    <input
                                        className={inputCls}
                                        placeholder="Tu nombre"
                                        value={form.name}
                                        onChange={(e) => set('name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-white/35 uppercase tracking-wider block mb-1.5">Correo electrónico</label>
                                    <input
                                        className={inputCls}
                                        type="email"
                                        placeholder="tu@correo.com"
                                        value={form.email}
                                        onChange={(e) => set('email', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-white/35 uppercase tracking-wider block mb-1.5">¿A qué te dedicas?</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {ROLES.map((r) => (
                                            <button
                                                key={r.value}
                                                type="button"
                                                onClick={() => set('role', r.value)}
                                                className={cn(
                                                    'h-9 rounded-lg text-[12px] font-medium border transition-all text-left px-3',
                                                    form.role === r.value
                                                        ? 'bg-white text-gray-900 border-white'
                                                        : 'bg-white/[0.04] border-white/[0.1] text-white/50 hover:bg-white/[0.08] hover:text-white/70',
                                                )}
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={!canNext1}
                                onClick={() => setStep(2)}
                                className="w-full h-11 rounded-xl bg-white text-gray-900 text-[14px] font-semibold hover:bg-gray-100 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                            >
                                Siguiente
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* ── Step 2: Motivación ── */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <div>
                                <div className="text-[11px] text-white/30 uppercase tracking-wider mb-3">Paso 2 de 3</div>
                                <h2 className="text-[20px] font-black text-white tracking-tight leading-tight">¿Por qué Hi Krew?</h2>
                                <p className="text-[13px] text-white/40 mt-1">Esto nos ayuda a elegir los mejores testers para la beta.</p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[11px] text-white/35 uppercase tracking-wider block mb-1.5">
                                        ¿Cómo usarías Hi Krew en tu trabajo?
                                    </label>
                                    <Textarea
                                        placeholder="Cuéntanos brevemente qué problema resolvería Hi Krew para ti, cómo gestionas hoy tus proyectos y clientes..."
                                        value={form.motivation}
                                        onChange={(e) => set('motivation', e.target.value)}
                                        className="bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/25 text-[13px] min-h-[110px] resize-none focus-visible:ring-white/20 rounded-xl"
                                    />
                                    <p className={cn('text-[11px] mt-1 text-right', form.motivation.length < 20 ? 'text-white/20' : 'text-white/35')}>
                                        {form.motivation.length} / mín. 20 caracteres
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[11px] text-white/35 uppercase tracking-wider block mb-1.5">Clientes que manejas actualmente</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CLIENT_VOLUMES.map((v) => (
                                            <button
                                                key={v.value}
                                                type="button"
                                                onClick={() => set('clientVolume', v.value)}
                                                className={cn(
                                                    'h-9 rounded-lg text-[12px] font-medium border transition-all px-3 text-left',
                                                    form.clientVolume === v.value
                                                        ? 'bg-white text-gray-900 border-white'
                                                        : 'bg-white/[0.04] border-white/[0.1] text-white/50 hover:bg-white/[0.08] hover:text-white/70',
                                                )}
                                            >
                                                {v.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="h-11 w-11 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white/40 hover:text-white/70 transition-colors flex items-center justify-center shrink-0"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    disabled={!canNext2}
                                    onClick={() => setStep(3)}
                                    className="flex-1 h-11 rounded-xl bg-white text-gray-900 text-[14px] font-semibold hover:bg-gray-100 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                                >
                                    Siguiente
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Términos beta ── */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <div>
                                <div className="text-[11px] text-white/30 uppercase tracking-wider mb-3">Paso 3 de 3</div>
                                <h2 className="text-[20px] font-black text-white tracking-tight leading-tight">Antes de entrar.</h2>
                                <p className="text-[13px] text-white/40 mt-1">Lee y acepta las condiciones de la beta cerrada.</p>
                            </div>

                            <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 text-[12px] text-white/35 leading-relaxed space-y-2">
                                <p>Hi Krew Beta es una versión <span className="text-white/55 font-medium">en desarrollo activo</span>. Puedes encontrar errores, funciones incompletas o cambios sin previo aviso.</p>
                                <p>Tu feedback es fundamental para construir el mejor producto posible para freelancers de Centroamérica.</p>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <Checkbox
                                        checked={form.acceptErrors}
                                        onCheckedChange={(c) => set('acceptErrors', c as boolean)}
                                        className="mt-0.5 shrink-0 rounded-[4px] border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
                                    />
                                    <span className="text-[13px] text-white/45 group-hover:text-white/60 transition-colors leading-snug">
                                        Entiendo que Hi Krew Beta puede contener errores, inestabilidades y cambios que afecten mi experiencia.
                                    </span>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <Checkbox
                                        checked={form.acceptFeedback}
                                        onCheckedChange={(c) => set('acceptFeedback', c as boolean)}
                                        className="mt-0.5 shrink-0 rounded-[4px] border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
                                    />
                                    <span className="text-[13px] text-white/45 group-hover:text-white/60 transition-colors leading-snug">
                                        Acepto compartir feedback con el equipo de Hi Krew para ayudar a mejorar la plataforma.
                                    </span>
                                </label>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="h-11 w-11 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white/40 hover:text-white/70 transition-colors flex items-center justify-center shrink-0"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    disabled={!canSubmit}
                                    onClick={handleSubmit}
                                    className="flex-1 h-11 rounded-xl bg-white text-gray-900 text-[14px] font-semibold hover:bg-gray-100 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                                >
                                    <Zap className="h-4 w-4" />
                                    Enviar solicitud
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 4: Éxito ── */}
                    {step === 4 && (
                        <div className="text-center py-4 space-y-4">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                                <Check className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-[20px] font-black text-white tracking-tight">¡Solicitud enviada!</h2>
                                <p className="text-[13px] text-white/40 mt-1.5 leading-relaxed max-w-[280px] mx-auto">
                                    Revisaremos tu perfil y te contactaremos a <span className="text-white/60">{form.email}</span> si eres seleccionado para la beta.
                                </p>
                            </div>
                            <div className="inline-flex items-center gap-2 border border-white/[0.08] rounded-full px-4 py-2 text-[11px] text-white/30">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
                                </span>
                                Revisión en curso · Equipo Hi Krew
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full h-10 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/50 text-[13px] hover:bg-white/[0.1] hover:text-white/70 transition-colors mt-2"
                            >
                                Cerrar
                            </button>
                        </div>
                    )}

                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Waitlist ──────────────────────────────────────────────────────────────────

function WaitlistPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [betaOpen, setBetaOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen w-full flex bg-[#0d0d0d] font-sans">

            {/* ── Left: Form ── */}
            <div className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 lg:p-16">

                {/* Logo + back link */}
                <div className="flex items-center justify-between shrink-0">
                    <div className="inline-flex items-center gap-2.5">
                        <Image src="/HiKrewLogo.png" alt="Hi Krew" width={24} height={24} className="object-contain opacity-90" />
                        <span className="font-bold text-[15px] text-white/80 tracking-tight">Hi Krew</span>
                    </div>
                    <a href={PUBLIC_URL} className="inline-flex items-center gap-1.5 text-[12px] text-white/35 hover:text-white/60 transition-colors">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Volver al sitio
                    </a>
                </div>

                {/* Content */}
                <div className="flex-1 flex items-center justify-center py-10">
                    <div className="w-full max-w-[400px]">

                        <div className="inline-flex items-center gap-2 border border-white/[0.08] rounded-full px-3 py-1.5 mb-6">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
                            </span>
                            <span className="text-[11px] text-white/35 uppercase tracking-wider">Acceso anticipado</span>
                        </div>

                        <h1 className="text-[26px] font-black tracking-tight text-white leading-tight mb-1.5">
                            Estamos preparando<br />el lanzamiento.
                        </h1>
                        <p className="text-[14px] text-white/40 mb-8">
                            Hi Krew está creciendo en Centroamérica. Deja tu correo y te avisamos cuando abra el acceso libre.
                        </p>

                        {!submitted ? (
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <AuthInput
                                    type="email"
                                    placeholder="Tu correo electrónico"
                                    icon={<Mail className="h-4 w-4" />}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/40 focus-visible:ring-white/20 dark:bg-white/[0.06] dark:border-white/[0.12]"
                                />
                                <button
                                    type="submit"
                                    className="w-full h-11 rounded-xl bg-white text-gray-900 text-[14px] font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Send className="h-4 w-4" />
                                    Unirme a la lista
                                </button>
                            </form>
                        ) : (
                            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/[0.15]">
                                <span className="relative flex h-2 w-2 mt-1 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                                </span>
                                <div>
                                    <p className="text-[13px] text-emerald-300/90 font-medium leading-snug">¡Listo! Te tenemos en la lista.</p>
                                    <p className="text-[12px] text-emerald-400/50 mt-0.5">Te escribiremos a <span className="text-emerald-400/70">{email}</span> cuando abramos.</p>
                                </div>
                            </div>
                        )}

                        {/* Beta CTA */}
                        <div className="mt-4 pt-4 border-t border-white/[0.06]">
                            <p className="text-[12px] text-white/25 mb-2.5 text-center">¿Quieres entrar antes?</p>
                            <button
                                type="button"
                                onClick={() => setBetaOpen(true)}
                                className="w-full h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/45 text-[13px] font-medium hover:bg-white/[0.08] hover:text-white/70 hover:border-white/[0.15] transition-all flex items-center justify-center gap-2"
                            >
                                <Zap className="h-3.5 w-3.5 text-amber-400/70" />
                                Solicitar acceso a la Beta
                            </button>
                        </div>

                        <div className="mt-8 space-y-3">
                            {[
                                'Cotizaciones profesionales en minutos',
                                'Tus clientes aprueban con un clic',
                                'Gestiona proyectos y entregables',
                                'Cobra por hitos de pago',
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-white/15 tabular-nums w-4 shrink-0">0{i + 1}</span>
                                    <div className="h-px flex-1 bg-white/[0.05]" />
                                    <span className="text-[12px] text-white/30">{item}</span>
                                </div>
                            ))}
                        </div>

                        <p className="text-center text-[13px] text-white/35 mt-8">
                            ¿Ya tienes cuenta?{' '}
                            <Link href="/login" className="text-white/60 font-medium hover:text-white transition-colors">
                                Inicia sesión
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[11px] text-white/20 shrink-0">
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
                        style={{ background: 'radial-gradient(ellipse 60% 80% at 70% 100%, rgba(255,255,255,0.015) 0%, transparent 70%)' }}
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
                            <span className="text-[11px] text-white/35">Próximamente · Centroamérica</span>
                        </div>
                    </div>
                </div>
            </div>

            <BetaModal open={betaOpen} onClose={() => setBetaOpen(false)} />
        </div>
    );
}

// ─── Register form ─────────────────────────────────────────────────────────────

export default function RegisterPage() {
    if (!ENABLE_REGISTER) return <WaitlistPage />;

    return <RegisterForm />;
}

function RegisterForm() {
    const { register, isLoading, error } = useAuth();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (!acceptedTerms) {
            setLocalError('Debes aceptar los términos y condiciones para continuar.');
            return;
        }

        try {
            await register({
                email,
                password,
                firstName,
                lastName,
                role: UserRole.FREELANCER,
            });
        } catch (err) {
            console.error('Error al registrarse', err);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#0d0d0d] font-sans">

            {/* ── Left: Form ── */}
            <div className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 lg:p-16 overflow-y-auto">

                {/* Logo + back link */}
                <div className="flex items-center justify-between shrink-0">
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
                <div className="flex-1 flex items-center justify-center py-10">
                    <div className="w-full max-w-[400px]">

                        <h1 className="text-[26px] font-black tracking-tight text-white leading-tight mb-1.5">
                            Crea tu cuenta gratis.
                        </h1>
                        <p className="text-[14px] text-white/40 mb-8">
                            Sin tarjeta de crédito. Empieza en segundos.
                        </p>

                        <form onSubmit={handleRegister} className="space-y-3">
                            {(error || localError) && (
                                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-red-500/[0.07] border border-red-500/[0.15] animate-in fade-in slide-in-from-top-1 duration-200">
                                    <AlertCircle className="h-4 w-4 text-red-400/70 mt-0.5 shrink-0" />
                                    <p className="text-[13px] text-red-300/80 leading-snug">{localError || error}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <AuthInput
                                    type="text"
                                    placeholder="Nombre"
                                    icon={<User className="h-4 w-4" />}
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    className="bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/40 focus-visible:ring-white/20 dark:bg-white/[0.06] dark:border-white/[0.12]"
                                />
                                <AuthInput
                                    type="text"
                                    placeholder="Apellido"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    className="bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/40 focus-visible:ring-white/20 dark:bg-white/[0.06] dark:border-white/[0.12]"
                                />
                            </div>

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
                                placeholder="Contraseña (mín. 8 caracteres)"
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
                                minLength={8}
                                className="bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/40 focus-visible:ring-white/20 dark:bg-white/[0.06] dark:border-white/[0.12]"
                            />

                            <div className="flex items-start gap-2.5 pt-1">
                                <Checkbox
                                    id="terms"
                                    checked={acceptedTerms}
                                    onCheckedChange={(c) => setAcceptedTerms(c as boolean)}
                                    className="rounded-[4px] border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-gray-900 mt-0.5 shrink-0"
                                />
                                <Label htmlFor="terms" className="text-[12px] text-white/35 leading-relaxed cursor-pointer">
                                    Al registrarte aceptas nuestros{' '}
                                    <Link href="/terminos" className="text-white/55 hover:text-white underline underline-offset-2 transition-colors">Términos de uso</Link>
                                    {' '}y{' '}
                                    <Link href="/privacidad" className="text-white/55 hover:text-white underline underline-offset-2 transition-colors">Política de privacidad</Link>.
                                </Label>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 rounded-xl bg-white text-gray-900 text-[14px] font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
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
                            onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`; }}
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
                            ¿Ya tienes cuenta?{' '}
                            <Link href="/login" className="text-white/60 font-medium hover:text-white transition-colors">
                                Inicia sesión
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[11px] text-white/20 shrink-0">
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
                        style={{ background: 'radial-gradient(ellipse 60% 80% at 70% 100%, rgba(255,255,255,0.015) 0%, transparent 70%)' }}
                    />

                    <div className="relative z-10 max-w-xs text-center px-8">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mx-auto mb-8">
                            <Image src="/HiKrewLogo.png" alt="Hi Krew" width={22} height={22} className="object-contain opacity-80" />
                        </div>

                        <h2 className="text-[32px] font-black text-white tracking-tight leading-[1.05] mb-4">
                            De la idea<br />
                            <span className="text-white/30">al cobro.</span>
                        </h2>

                        <p className="text-[13px] text-white/35 leading-relaxed mb-10">
                            Un flujo continuo para freelancers y agencias de Centroamérica. Sin cambiar de herramienta.
                        </p>

                        <div className="space-y-3 text-left">
                            {['Crea un deal y arma tu cotización', 'Tu cliente aprueba con un clic', 'Gestiona tareas y entregables', 'Cobra por hitos'].map((s, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-white/20 tabular-nums w-4 shrink-0">0{i + 1}</span>
                                    <div className="h-px flex-1 bg-white/[0.06]" />
                                    <span className="text-[12px] text-white/40">{s}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
