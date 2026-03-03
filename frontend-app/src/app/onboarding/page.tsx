'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import api from '@/lib/api';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { AuthInput } from '@/components/common/AuthInput';
import { Building2, MapPin, Briefcase, ChevronRight, Upload, X } from 'lucide-react';
import Image from 'next/image';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import paisData from '@/data/localization/pais.json';
import guatemalaData from '@/data/localization/guatemala.json';

// ─── Use-case categories ───────────────────────────────────────────────────
const USE_CASES = [
    { id: 'audio', emoji: '🎙️', label: 'Audio / Podcasts' },
    { id: 'video', emoji: '🎬', label: 'Video' },
    { id: 'foto', emoji: '📸', label: 'Fotografía' },
    { id: 'redaccion', emoji: '✍️', label: 'Redacción' },
    { id: 'desarrollo', emoji: '💻', label: 'Desarrollo' },
    { id: 'diseno', emoji: '🎨', label: 'Diseño' },
    { id: 'consultoria', emoji: '📊', label: 'Consultoría' },
    { id: 'marketing', emoji: '📣', label: 'Marketing' },
    { id: 'educacion', emoji: '📚', label: 'Educación' },
    { id: 'otro', emoji: '📦', label: 'Otro' },
];

// ─── Step indicator ────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center gap-2">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i < current ? 'w-8 bg-zinc-900' : i === current ? 'w-8 bg-zinc-900' : 'w-4 bg-zinc-200'
                        }`}
                />
            ))}
        </div>
    );
}

// ─── Pill component ─────────────────────────────────────────────────────────
function UseCasePill({
    emoji,
    label,
    selected,
    onClick,
}: {
    emoji: string;
    label: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all duration-150 select-none
                ${selected
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm scale-[1.02]'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50'
                }`}
        >
            <span>{emoji}</span>
            {label}
        </button>
    );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function OnboardingPage() {
    const { activeWorkspaceId, activeWorkspace } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step 1 — Negocio
    const [businessName, setBusinessName] = useState(activeWorkspace?.businessName || '');
    const [logoPreview, setLogoPreview] = useState<string | null>(activeWorkspace?.logo || null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Step 2 — Ubicación & Moneda
    const [country, setCountry] = useState(activeWorkspace?.country || 'GT');
    const [stateValue, setStateValue] = useState(activeWorkspace?.state || '');
    const [currency, setCurrency] = useState('GTQ');

    // Step 3 — Casos de uso
    const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);

    const TOTAL_STEPS = 3;

    const activeCountryData = (paisData as any)[country];
    const lvl1Label = activeCountryData?.labels?.lvl1 || 'Región';
    const lvl1Options: string[] =
        country === 'GT'
            ? guatemalaData.map((d: any) => d.title)
            : activeCountryData?.regions?.map((r: any) => r.name) || [];

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const toggleUseCase = (id: string) => {
        setSelectedUseCases((prev) =>
            prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
        );
    };

    const handleNextStep = () => {
        setError(null);
        if (step === 0 && !businessName.trim()) {
            setError('El nombre de tu negocio es requerido.');
            return;
        }
        if (step === 1 && !stateValue) {
            setError(`Por favor selecciona un ${lvl1Label}.`);
            return;
        }
        setStep((s) => s + 1);
    };

    const handleFinish = async (skip = false) => {
        if (!activeWorkspaceId) return;
        setIsSubmitting(true);
        setError(null);

        try {
            // Upload logo if selected
            if (logoFile) {
                const formData = new FormData();
                formData.append('file', logoFile);
                await api.post(`/workspaces/current/logo`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            // Save workspace data
            await api.patch('/workspaces/current', {
                businessName,
                country,
                state: stateValue,
                currencies: [{ code: currency, name: currency, symbol: currency, isDefault: true }],
                useCases: skip ? [] : selectedUseCases,
                onboardingCompleted: true,
            });

            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ocurrió un error. Intenta de nuevo.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
            <div className="w-full max-w-lg">

                {/* Logo + header */}
                <div className="text-center mb-10">
                    <div className="w-11 h-11 bg-black rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                            <path d="M13 3L4 14H12L11 21L20 10H12L13 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <StepIndicator current={step} total={TOTAL_STEPS} />
                    <p className="text-xs text-zinc-400 mt-3">Paso {step + 1} de {TOTAL_STEPS}</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">

                    {/* ── Step 0: Tu negocio ─────────────────────────── */}
                    {step === 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center">
                                    <Building2 className="w-4 h-4 text-zinc-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold text-zinc-900">Tu negocio</h1>
                                    <p className="text-sm text-zinc-500">¿Cómo se llama tu marca o negocio?</p>
                                </div>
                            </div>

                            <AuthInput
                                type="text"
                                placeholder="Nombre de tu negocio"
                                icon={<Building2 className="h-5 w-5" />}
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                            />

                            {/* Logo upload */}
                            <div>
                                <p className="text-sm font-medium text-zinc-700 mb-2">Logo <span className="text-zinc-400 font-normal">(opcional)</span></p>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-200 flex items-center justify-center cursor-pointer hover:border-zinc-400 transition-colors group overflow-hidden"
                                >
                                    {logoPreview ? (
                                        <>
                                            <Image src={logoPreview} alt="Logo" fill className="object-cover" />
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setLogoPreview(null); setLogoFile(null); }}
                                                className="absolute top-1 right-1 w-5 h-5 bg-zinc-900/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <Upload className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                                            <span className="text-xs text-zinc-400 group-hover:text-zinc-600 transition-colors">Subir</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />
                            </div>
                        </div>
                    )}

                    {/* ── Step 1: Ubicación ──────────────────────────── */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-zinc-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold text-zinc-900">¿Dónde estás?</h1>
                                    <p className="text-sm text-zinc-500">Esto nos ayuda a configurar tu zona horaria y moneda.</p>
                                </div>
                            </div>

                            {/* Country */}
                            <div>
                                <label className="text-sm font-medium text-zinc-700 block mb-1.5">País</label>
                                <Select value={country} onValueChange={(val) => { setCountry(val); setStateValue(''); }}>
                                    <SelectTrigger className="h-12 rounded-xl border-zinc-200 focus:ring-1 focus:ring-zinc-900">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <MapPin className="h-4 w-4" />
                                            <SelectValue placeholder="País" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(paisData).map(([code, data]: [string, any]) => (
                                            <SelectItem key={code} value={code}>{data.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* State / Region */}
                            <div>
                                <label className="text-sm font-medium text-zinc-700 block mb-1.5">{lvl1Label}</label>
                                <Select value={stateValue} onValueChange={setStateValue}>
                                    <SelectTrigger className="h-12 rounded-xl border-zinc-200 focus:ring-1 focus:ring-zinc-900">
                                        <SelectValue placeholder={`Selecciona ${lvl1Label}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lvl1Options.map((opt) => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Main currency */}
                            <div>
                                <label className="text-sm font-medium text-zinc-700 block mb-1.5">Moneda principal</label>
                                <Select value={currency} onValueChange={setCurrency}>
                                    <SelectTrigger className="h-12 rounded-xl border-zinc-200 focus:ring-1 focus:ring-zinc-900">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[
                                            { code: 'GTQ', label: 'Quetzal guatemalteco (GTQ)' },
                                            { code: 'USD', label: 'Dólar estadounidense (USD)' },
                                            { code: 'EUR', label: 'Euro (EUR)' },
                                            { code: 'MXN', label: 'Peso mexicano (MXN)' },
                                            { code: 'COP', label: 'Peso colombiano (COP)' },
                                            { code: 'ARS', label: 'Peso argentino (ARS)' },
                                            { code: 'CLP', label: 'Peso chileno (CLP)' },
                                            { code: 'PEN', label: 'Sol peruano (PEN)' },
                                            { code: 'BRL', label: 'Real brasileño (BRL)' },
                                            { code: 'GBP', label: 'Libra esterlina (GBP)' },
                                        ].map(({ code, label }) => (
                                            <SelectItem key={code} value={code}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Casos de uso ───────────────────────── */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center">
                                    <Briefcase className="w-4 h-4 text-zinc-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold text-zinc-900">¿Qué tipo de trabajo haces?</h1>
                                    <p className="text-sm text-zinc-500">Selecciona todo lo que aplique. Puedes cambiarlo después.</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2.5">
                                {USE_CASES.map(({ id, emoji, label }) => (
                                    <UseCasePill
                                        key={id}
                                        emoji={emoji}
                                        label={label}
                                        selected={selectedUseCases.includes(id)}
                                        onClick={() => toggleUseCase(id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg text-center font-medium">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-8 flex items-center justify-between">
                        {step > 0 ? (
                            <button
                                type="button"
                                onClick={() => setStep((s) => s - 1)}
                                className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors font-medium"
                            >
                                ← Atrás
                            </button>
                        ) : (
                            <div />
                        )}

                        <div className="flex items-center gap-3">
                            {step === 2 && (
                                <button
                                    type="button"
                                    onClick={() => handleFinish(true)}
                                    disabled={isSubmitting}
                                    className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors font-medium"
                                >
                                    Omitir
                                </button>
                            )}
                            <PrimaryButton
                                type="button"
                                onClick={step < TOTAL_STEPS - 1 ? handleNextStep : () => handleFinish(false)}
                                disabled={isSubmitting}
                                className="min-w-[130px]"
                            >
                                {isSubmitting ? 'Guardando...' : step < TOTAL_STEPS - 1 ? (
                                    <span className="flex items-center gap-1.5">
                                        Continuar <ChevronRight className="w-4 h-4" />
                                    </span>
                                ) : 'Comenzar →'}
                            </PrimaryButton>
                        </div>
                    </div>
                </div>

                {/* Footer note */}
                <p className="text-center text-xs text-zinc-400 mt-6">
                    Puedes cambiar todo esto después en tu configuración.
                </p>
            </div>
        </div>
    );
}
