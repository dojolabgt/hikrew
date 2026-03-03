'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthInput } from '@/components/common/AuthInput';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SocialButton } from '@/components/common/SocialButton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Mail, Lock, User, MapPin } from 'lucide-react';
import Link from 'next/link';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// Importing localization data
import paisData from '@/data/localization/pais.json';
import guatemalaData from '@/data/localization/guatemala.json';
import { UserRole } from '@/types';

export default function RegisterPage() {
    const { register, isLoading, error } = useAuth();
    const router = useRouter();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Localization state
    const [country, setCountry] = useState('GT');
    const [stateValue, setStateValue] = useState('');

    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const activeCountryData = (paisData as any)[country];
    const lvl1Label = activeCountryData?.labels?.lvl1 || 'Región';

    // Options for lvl1
    const lvl1Options = country === 'GT' ? guatemalaData.map((d: any) => d.title) : activeCountryData?.regions?.map((r: any) => r.name) || [];

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (!acceptedTerms) {
            setLocalError('Debes aceptar los términos y condiciones para continuar.');
            return;
        }

        if (!stateValue) {
            setLocalError(`Por favor selecciona un ${lvl1Label}.`);
            return;
        }

        try {
            await register({
                email,
                password,
                firstName,
                lastName,
                role: UserRole.FREELANCER,
                country,
                state: stateValue
            });
        } catch (err: any) {
            console.error('Error al registrarse', err);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-white dark:bg-zinc-950 font-sans">
            {/* Lado izquierdo - Formulario de registro */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 relative z-10 overflow-y-auto">
                <div className="w-full max-w-[440px] flex flex-col items-center">

                    {/* Logo */}
                    <div className="w-12 h-12 bg-black dark:bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm">
                        <svg className="w-6 h-6 text-white dark:text-black" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13 3L4 14H12L11 21L20 10H12L13 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    {/* Encabezado */}
                    <div className="text-center mb-8 w-full">
                        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white mb-2">Crea tu cuenta</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Ingresa tus datos para comenzar tu viaje con Blend.</p>
                    </div>

                    <form onSubmit={handleRegister} className="w-full space-y-4">
                        {(error || localError) && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-center font-medium">
                                {localError || error}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <AuthInput
                                type="text"
                                placeholder="Nombre"
                                icon={<User className="h-5 w-5" />}
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                            <AuthInput
                                type="text"
                                placeholder="Apellido"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>

                        {/* Campo de correo */}
                        <AuthInput
                            type="email"
                            placeholder="Correo electrónico"
                            icon={<Mail className="h-5 w-5" />}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        {/* Localización dinámica */}
                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <Select value={country} onValueChange={(val) => {
                                    setCountry(val);
                                    setStateValue('');
                                }}>
                                    <SelectTrigger className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-900 dark:bg-zinc-900">
                                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                                            <MapPin className="h-4 w-4" />
                                            <SelectValue placeholder="País" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(paisData).map(([code, data]: [string, any]) => (
                                            <SelectItem key={code} value={code}>
                                                {data.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-1/2">
                                <Select value={stateValue} onValueChange={setStateValue}>
                                    <SelectTrigger className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-900 dark:bg-zinc-900">
                                        <SelectValue placeholder={lvl1Label} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lvl1Options.map((opt: string) => (
                                            <SelectItem key={opt} value={opt}>
                                                {opt}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Campo de contraseña */}
                        <AuthInput
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Contraseña"
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
                            minLength={8}
                        />

                        {/* Terminos y condiciones */}
                        <div className="flex items-start space-x-2 pt-2">
                            <Checkbox
                                id="terms"
                                checked={acceptedTerms}
                                onCheckedChange={(c) => setAcceptedTerms(c as boolean)}
                                className="rounded-[4px] border-zinc-300 data-[state=checked]:bg-zinc-900 data-[state=checked]:text-white mt-0.5"
                            />
                            <Label htmlFor="terms" className="text-xs font-medium leading-relaxed text-zinc-600 dark:text-zinc-400 cursor-pointer">
                                Al registrarte, aceptas nuestros <Link href="/terms" className="text-zinc-900 dark:text-zinc-100 hover:underline">Términos de servicio</Link> y <Link href="/privacy" className="text-zinc-900 dark:text-zinc-100 hover:underline">Política de privacidad</Link>.
                            </Label>
                        </div>

                        {/* Botón de envío */}
                        <PrimaryButton
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-4"
                        >
                            {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                        </PrimaryButton>
                    </form>

                    {/* Separador */}
                    <div className="relative w-full my-6">
                        <div className="absolute inset-0 flex items-center">
                            <Separator className="w-full border-zinc-200 dark:border-zinc-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-500">O regístrate con</span>
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

                    {/* Footer con políticas */}
                    <div className="flex w-full justify-between items-center mt-auto pt-16 text-xs font-medium text-zinc-500 px-2 lg:px-4">
                        <span>©2026 Blend LTD. Todos los derechos reservados.</span>
                        <div className="flex gap-4">
                            <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-300">Privacidad</Link>
                            <span>•</span>
                            <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-300">Términos</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lado derecho - Splash oscuro (Exact match from Login but different copy) */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#09090b] relative p-4 pl-0">
                <div className="w-full h-full bg-gradient-to-tr from-zinc-900 to-zinc-950 rounded-2xl overflow-hidden relative border border-zinc-800/50 shadow-2xl flex flex-col items-center pt-20 px-12">

                    {/* Representación gráfica del dashboard (Identical to login for brand consistency) */}
                    <div className="w-full max-w-[600px] h-[500px] bg-[#121214] border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden opacity-90 backdrop-blur-3xl transform hover:scale-[1.01] transition-transform duration-500">
                        {/* Barra de encabezado */}
                        <div className="h-14 border-b border-zinc-800 flex items-center px-6 gap-4">
                            <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13 3L4 14H12L11 21L20 10H12L13 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="flex gap-2 items-center text-sm text-zinc-400">
                                <span className="text-zinc-300">Campañas</span>
                                <span>/</span>
                                <span>Bootcamp de diseño</span>
                            </div>
                        </div>
                        {/* Contenido del cuerpo */}
                        <div className="flex flex-1 p-6 gap-6 relative">
                            {/* Menú interno */}
                            <div className="w-64 bg-[#18181b] rounded-xl border border-zinc-800 p-4 space-y-4 shadow-inner">
                                <div className="text-xs font-medium text-zinc-500 mb-2">MENSAJES</div>
                                {['Correo', 'Mensaje en App', 'Notificación Push', 'Mensaje de Slack', 'SMS Twilio'].map((item, i) => (
                                    <div key={i} className={`flex items-center gap-3 text-sm px-3 py-2 rounded-lg ${i === 0 ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
                                        <div className="w-4 h-4 rounded-sm border border-zinc-700"></div>
                                        {item}
                                    </div>
                                ))}
                                <div className="text-xs font-medium text-zinc-500 mt-6 mb-2">DATOS</div>
                                {['Crear Persona', 'Enviar Evento', 'Actualización Masiva'].map((item, i) => (
                                    <div key={i + 10} className="flex items-center gap-3 text-sm px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50">
                                        <div className="w-4 h-4 rounded-full border border-zinc-700"></div>
                                        {item}
                                    </div>
                                ))}
                            </div>
                            {/* Área de canvas */}
                            <div className="flex-1 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-[length:100px_100px] rounded-xl border border-zinc-800/50 relative overflow-hidden flex items-center justify-center">
                                <div className="absolute right-10 top-20 w-48 bg-zinc-800/80 backdrop-blur-md border border-zinc-700 rounded-xl p-4 flex gap-3 shadow-xl">
                                    <div className="mt-1"><svg className="w-5 h-5 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg></div>
                                    <div>
                                        <div className="text-sm font-medium text-white">Disparador</div>
                                        <div className="text-xs text-zinc-400">class-drop</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-16 w-full flex flex-col items-center">
                        <h2 className="text-2xl font-semibold text-white mb-2">Empieza a Crear</h2>
                        <p className="text-zinc-400 text-sm mb-8 text-center max-w-sm">
                            Únete de forma gratuita y lleva el control total de tus clientes, pagos y proyectos desde hoy.
                        </p>

                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                            <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
