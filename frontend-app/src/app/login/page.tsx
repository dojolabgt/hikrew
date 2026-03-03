'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthInput } from '@/components/common/AuthInput';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SocialButton } from '@/components/common/SocialButton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const { login, isLoading, error } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({ email, password });
        } catch (err) {
            console.error('Error al iniciar sesión', err);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-white dark:bg-zinc-950 font-sans">
            {/* Lado izquierdo - Formulario de inicio de sesión */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 relative z-10">
                <div className="w-full max-w-[400px] flex flex-col items-center">

                    {/* Logo */}
                    <div className="w-12 h-12 bg-black dark:bg-white rounded-xl flex items-center justify-center mb-8 shadow-sm">
                        <svg className="w-6 h-6 text-white dark:text-black" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13 3L4 14H12L11 21L20 10H12L13 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    {/* Encabezado */}
                    <div className="text-center mb-8 w-full">
                        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white mb-2">¡Bienvenido de nuevo!</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Ingresa tu correo y contraseña para continuar.</p>
                    </div>

                    <form onSubmit={handleLogin} className="w-full space-y-5">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-center font-medium">
                                {error}
                            </div>
                        )}

                        {/* Campo de correo */}
                        <AuthInput
                            type="email"
                            placeholder="Ingresa tu correo electrónico"
                            icon={<Mail className="h-5 w-5" />}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        {/* Campo de contraseña */}
                        <AuthInput
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Ingresa tu contraseña"
                            icon={<Lock className="h-5 w-5" />}
                            rightElement={
                                <button
                                    type="button"
                                    className="hover:text-zinc-600 transition-colors focus:outline-none"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            }
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        {/* Recordarme y Olvidé mi contraseña */}
                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="remember" className="rounded-[4px] border-zinc-300 data-[state=checked]:bg-zinc-900 data-[state=checked]:text-white" />
                                <Label htmlFor="remember" className="text-sm font-medium leading-none text-zinc-600 dark:text-zinc-400 cursor-pointer">
                                    Recordarme
                                </Label>
                            </div>
                            <Link href="/forgot-password" className="text-sm font-semibold text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300">
                                Olvidé mi contraseña
                            </Link>
                        </div>

                        {/* Botón de envío */}
                        <PrimaryButton
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-2"
                        >
                            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                        </PrimaryButton>
                    </form>

                    {/* Separador */}
                    <div className="relative w-full my-8">
                        <div className="absolute inset-0 flex items-center">
                            <Separator className="w-full border-zinc-200 dark:border-zinc-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-500">O inicia sesión con</span>
                        </div>
                    </div>

                    <div className="w-full flex gap-3">
                        <SocialButton
                            onClick={() => {
                                window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
                            }}
                            icon={
                                <svg className="h-4 w-4" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    <path d="M1 1h22v22H1z" fill="none" />
                                </svg>
                            }
                        >
                            Google
                        </SocialButton>
                    </div>

                    {/* Enlaces inferiores */}
                    <div className="mt-8 text-sm text-zinc-500">
                        ¿No tienes una cuenta? <Link href="/register" className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline">Crear una cuenta</Link>
                    </div>

                    {/* Footer con políticas */}
                    <div className="flex w-full justify-between items-center mt-auto pt-24 text-xs font-medium text-zinc-500 w-full px-2">
                        <span>©2026 Blend LTD. Todos los derechos reservados.</span>
                        <div className="flex gap-4">
                            <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-300">Política de privacidad</Link>
                            <span>•</span>
                            <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-300">Términos y condiciones</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lado derecho - Splash oscuro */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#09090b] relative p-4 pl-0">
                <div className="w-full h-full bg-gradient-to-tr from-zinc-900 to-zinc-950 rounded-2xl overflow-hidden relative border border-zinc-800/50 shadow-2xl flex flex-col items-center pt-20 px-12">

                    {/* Representación gráfica del dashboard */}
                    <div className="w-full max-w-[650px] h-[520px] bg-zinc-950 border border-zinc-800/60 rounded-xl shadow-2xl flex overflow-hidden opacity-90 backdrop-blur-3xl transform hover:scale-[1.01] transition-transform duration-500">

                        {/* Sidebar Mock */}
                        <div className="w-48 bg-zinc-950 border-r border-zinc-800/60 flex flex-col p-4">
                            <div className="flex items-center gap-2 px-2 mb-8 mt-2 text-white">
                                <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
                                    <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M13 3L4 14H12L11 21L20 10H12L13 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <span className="font-semibold text-sm tracking-tight">Blend Studio</span>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-3 px-3 py-2 bg-zinc-800/50 text-white rounded-lg text-xs font-medium border border-zinc-700/50">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                    Dashboard
                                </div>
                                {[
                                    { icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, label: 'Clientes' },
                                    { icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, label: 'Cotizaciones' },
                                    { icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>, label: 'Pagos' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white rounded-lg text-xs font-medium transition-colors">
                                        {item.icon}
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Main Content Mock */}
                        <div className="flex-1 flex flex-col bg-[#0c0c0e] relative overflow-hidden">
                            {/* Subtle noise overlay */}
                            <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>

                            {/* Header Mock */}
                            <div className="h-14 border-b border-zinc-800/60 flex justify-between items-center px-6 relative z-10 bg-zinc-950/50 backdrop-blur-md">
                                <div className="text-sm font-medium text-white">Resumen</div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-400">RC</div>
                                </div>
                            </div>

                            {/* Dashboard Body Mock */}
                            <div className="flex-1 p-6 relative z-10 space-y-6">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { label: 'Ingresos del mes', value: 'Q12,450.00', trend: '+14%', positive: true },
                                        { label: 'Cobros pendientes', value: 'Q3,200.00', trend: '2 facturas', positive: false },
                                        { label: 'Cotizaciones activas', value: '5', trend: 'Q8,500 total', positive: true },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 shadow-sm">
                                            <div className="text-xs text-zinc-400 font-medium mb-1">{stat.label}</div>
                                            <div className="text-xl font-semibold text-white mb-2 tracking-tight">{stat.value}</div>
                                            <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex ${stat.positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                                {stat.trend}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Recent Activity List */}
                                <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden">
                                    <div className="px-5 py-4 border-b border-zinc-800/60 flex justify-between items-center">
                                        <h3 className="text-sm font-medium text-white">Actividad Reciente</h3>
                                        <span className="text-xs text-zinc-500 hover:text-zinc-300">Ver todo</span>
                                    </div>
                                    <div className="divide-y divide-zinc-800/60">
                                        {[
                                            { client: 'Acme Corp', desc: 'Pago recibido - Landing Page', amount: 'Q4,500.00', status: 'Pagado', color: 'emerald' },
                                            { client: 'Studio Creativo', desc: 'Cotización aceptada', amount: 'Q2,800.00', status: 'Aprobado', color: 'blue' },
                                            { client: 'Tech Start', desc: 'Pago pendiente - Consultoría', amount: 'Q1,200.00', status: 'Pendiente', color: 'amber' },
                                        ].map((item, i) => (
                                            <div key={i} className="px-5 py-4 flex justify-between items-center hover:bg-zinc-800/20 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-300`}>
                                                        {item.client.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-white">{item.client}</div>
                                                        <div className="text-xs text-zinc-500">{item.desc}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-white">{item.amount}</div>
                                                    <div className={`text-[10px] font-medium text-${item.color}-400`}>{item.status}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-12 w-full flex flex-col items-center">
                        <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">Tu negocio en un solo lugar</h2>
                        <p className="text-zinc-400 text-sm mb-8 text-center max-w-sm">
                            Gestiona clientes, envía cotizaciones y recibe pagos recurrentes sin complicaciones.
                        </p>

                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                            <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                            <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}