'use client';

import { use, useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/image-utils';

// Reusing base URL from environment
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type SchemaField = {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';
    label: string;
    required: boolean;
    description?: string;
    options?: { label: string; value: string }[];
    allowOther?: boolean;
};

export default function PublicBriefPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [briefData, setBriefData] = useState<any>(null);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [otherValues, setOtherValues] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchBrief = async () => {
            try {
                const res = await fetch(`${apiUrl}/public/briefs/${token}`);
                if (!res.ok) {
                    if (res.status === 404) return notFound();
                    throw new Error('Error cargando el brief');
                }
                const json = await res.json();
                // NestJS Interceptors wrap API response in a `data` object
                const briefRecord = json.data ? json.data : json;

                setBriefData(briefRecord);
                if (briefRecord.responses) {
                    setResponses(briefRecord.responses);
                }
            } catch (error) {
                console.error(error);
                toast.error('No se pudo cargar el formulario');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBrief();
    }, [token]);

    const handleChange = (fieldId: string, value: any) => {
        setResponses(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleOtherChange = (fieldId: string, value: string) => {
        setOtherValues(prev => ({ ...prev, [fieldId]: value }));
        // Automatically select the 'other' option in the main response
        handleChange(fieldId, 'other');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Process 'other' responses
        const finalResponses = { ...responses };
        briefData?.template?.schema?.forEach((field: SchemaField) => {
            if (field.allowOther && finalResponses[field.id] === 'other') {
                finalResponses[field.id] = `Otro: ${otherValues[field.id] || ''}`;
            }
        });

        setIsSubmitting(true);
        try {
            const res = await fetch(`${apiUrl}/public/briefs/${token}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalResponses),
            });

            if (!res.ok) throw new Error('Error enviando el brief');

            // Set locally as completed to show success screen
            setBriefData((prev: any) => ({ ...prev, isCompleted: true }));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error(error);
            toast.error('Ocurrió un error al enviar tus respuestas. Intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (!briefData) return null;

    const { template, deal } = briefData;
    const schema = template?.schema || [];
    const isCompleted = briefData.isCompleted;

    if (isCompleted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-center">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">¡Brief enviado exitosamente!</h1>
                <p className="text-zinc-500 max-w-md mx-auto mb-8">
                    Tus respuestas para el proyecto "{deal?.name}" han sido guardadas de forma segura. El equipo a cargo se pondrá en contacto contigo pronto con los siguientes pasos.
                </p>
            </div>
        );
    }

    const workspace = deal?.workspace;
    const isProOrPremium = workspace?.plan === 'pro' || workspace?.plan === 'premium';

    // Shared label component for Native HTML
    const Label = ({ children, required, className = '' }: { children: React.ReactNode, required?: boolean, className?: string }) => (
        <label className={`text-base font-semibold flex mb-1.5 ${className}`}>
            {children}
            {required && <span className="text-rose-500 ml-1.5">*</span>}
        </label>
    );

    const inputClasses = "flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300";

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 selection:bg-black selection:text-white font-sans flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {isProOrPremium ? (
                            workspace?.logo ? (
                                <img src={getImageUrl(workspace.logo)} alt={workspace.name || "Workspace"} className="h-10 w-auto rounded object-contain dark:invert-0" />
                            ) : (
                                <div className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-lg flex items-center justify-center font-bold text-lg">
                                    {workspace?.name?.charAt(0) || 'B'}
                                </div>
                            )
                        ) : (
                            <img src="/HiKrewLogo.png" alt="Hi Krew" className="h-8 w-auto object-contain dark:invert" />
                        )}
                        <div>
                            <span className="font-semibold text-base text-black dark:text-white block leading-none mb-1">
                                {isProOrPremium ? workspace?.name : 'Hi Krew'}
                            </span>
                            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Cuestionario de Proyecto</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-6">
                            <FileText className="w-8 h-8 text-zinc-700 dark:text-zinc-300" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            {template?.name || 'Cuestionario de Proyecto'}
                        </h1>
                        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                            Ayúdanos a entender mejor tus necesidades para "{deal?.name}" llenando este breve formulario.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-200/50 dark:shadow-none rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                            <p className="text-sm font-medium text-zinc-500 flex items-center justify-between">
                                <span>Completado para: <strong className="text-zinc-900 dark:text-zinc-100">{deal?.workspace?.name || 'El Agencia'}</strong></span>
                                <span>{schema.length} preguntas</span>
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-10">
                            {schema.map((field: SchemaField, index: number) => (
                                <div key={field.id} className="space-y-4">
                                    <div>
                                        <Label required={field.required}>
                                            <span className="text-zinc-400 mr-2">{index + 1}.</span>
                                            {field.label}
                                        </Label>
                                        {field.description && (
                                            <p className="text-sm text-zinc-500 ml-6">{field.description}</p>
                                        )}
                                    </div>

                                    <div className="ml-6">
                                        {field.type === 'text' && (
                                            <Input
                                                value={responses[field.id] || ''}
                                                onChange={(e) => handleChange(field.id, e.target.value)}
                                                required={field.required}
                                                placeholder="Tu respuesta..."
                                                className="max-w-xl"
                                            />
                                        )}

                                        {field.type === 'textarea' && (
                                            <textarea
                                                value={responses[field.id] || ''}
                                                onChange={(e) => handleChange(field.id, e.target.value)}
                                                required={field.required}
                                                placeholder="Escribe el detalle aquí..."
                                                className={`${inputClasses} min-h-[120px] max-w-xl resize-y`}
                                            />
                                        )}

                                        {field.type === 'radio' && (
                                            <div className="space-y-3">
                                                {field.options?.map((opt) => (
                                                    <label key={opt.value} className="flex items-center space-x-3 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name={field.id}
                                                            value={opt.value}
                                                            checked={responses[field.id] === opt.value}
                                                            disabled={isSubmitting}
                                                            onChange={(e) => handleChange(field.id, e.target.value)}
                                                            required={field.required && !responses[field.id]}
                                                            className="w-4 h-4 text-primary bg-zinc-100 border-zinc-300 focus:ring-primary dark:focus:ring-primary dark:ring-offset-zinc-800 focus:ring-2 dark:bg-zinc-700 dark:border-zinc-600"
                                                        />
                                                        <span className="text-sm font-normal text-zinc-900 dark:text-zinc-100">
                                                            {opt.label}
                                                        </span>
                                                    </label>
                                                ))}
                                                {field.allowOther && (
                                                    <div className="flex items-center space-x-3 mt-2">
                                                        <label className="flex items-center space-x-3 cursor-pointer shrink-0">
                                                            <input
                                                                type="radio"
                                                                name={field.id}
                                                                value="other"
                                                                checked={responses[field.id] === 'other'}
                                                                disabled={isSubmitting}
                                                                onChange={(e) => handleChange(field.id, e.target.value)}
                                                                className="w-4 h-4 text-primary bg-zinc-100 border-zinc-300 focus:ring-primary dark:focus:ring-primary dark:ring-offset-zinc-800 focus:ring-2 dark:bg-zinc-700 dark:border-zinc-600"
                                                            />
                                                            <span className="text-sm font-normal text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                                                                Otra opción:
                                                            </span>
                                                        </label>
                                                        <Input
                                                            value={otherValues[field.id] || ''}
                                                            onChange={(e) => handleOtherChange(field.id, e.target.value)}
                                                            onFocus={() => handleChange(field.id, 'other')}
                                                            disabled={isSubmitting}
                                                            placeholder="Especificar..."
                                                            className="h-8 py-1 max-w-xs"
                                                            required={responses[field.id] === 'other'}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {field.type === 'checkbox' && (
                                            <div className="space-y-3">
                                                {field.options?.map((opt) => {
                                                    const isChecked = (responses[field.id] || []).includes(opt.value);
                                                    return (
                                                        <label key={opt.value} className="flex items-start space-x-3 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                disabled={isSubmitting}
                                                                onChange={(e) => {
                                                                    const current = responses[field.id] || [];
                                                                    const newVal = e.target.checked
                                                                        ? [...current, opt.value]
                                                                        : current.filter((v: string) => v !== opt.value);
                                                                    handleChange(field.id, newVal);
                                                                }}
                                                                className="w-4 h-4 mt-0.5 text-primary bg-zinc-100 border-zinc-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-zinc-800 focus:ring-2 dark:bg-zinc-700 dark:border-zinc-600"
                                                            />
                                                            <span className="text-sm font-normal text-zinc-900 dark:text-zinc-100">
                                                                {opt.label}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                                {field.allowOther && (
                                                    <div className="flex items-start space-x-3 pt-2">
                                                        <label className="flex items-center space-x-3 cursor-pointer shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={(responses[field.id] || []).includes('other')}
                                                                disabled={isSubmitting}
                                                                onChange={(e) => {
                                                                    const current = responses[field.id] || [];
                                                                    const newVal = e.target.checked
                                                                        ? [...current, 'other']
                                                                        : current.filter((v: string) => v !== 'other');
                                                                    handleChange(field.id, newVal);
                                                                }}
                                                                className="w-4 h-4 text-primary bg-zinc-100 border-zinc-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-zinc-800 focus:ring-2 dark:bg-zinc-700 dark:border-zinc-600"
                                                            />
                                                            <span className="text-sm font-normal text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                                                                Otra opción:
                                                            </span>
                                                        </label>
                                                        <div className="flex-1 -mt-1 flex items-center gap-3">
                                                            <Input
                                                                value={otherValues[field.id] || ''}
                                                                onChange={(e) => {
                                                                    setOtherValues(prev => ({ ...prev, [field.id]: e.target.value }));
                                                                    const current = responses[field.id] || [];
                                                                    if (!current.includes('other')) {
                                                                        handleChange(field.id, [...current, 'other']);
                                                                    }
                                                                }}
                                                                disabled={isSubmitting}
                                                                placeholder="Especificar..."
                                                                className="h-8 py-1 max-w-xs"
                                                                required={(responses[field.id] || []).includes('other')}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {field.type === 'select' && (
                                            <div className="max-w-md">
                                                <select
                                                    value={responses[field.id] || ''}
                                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                                    required={field.required}
                                                    disabled={isSubmitting}
                                                    className={`${inputClasses} bg-white dark:bg-zinc-950`}
                                                >
                                                    <option value="" disabled>Selecciona una opción...</option>
                                                    {field.options?.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                    {field.allowOther && (
                                                        <option value="other">Otra opción...</option>
                                                    )}
                                                </select>

                                                {responses[field.id] === 'other' && (
                                                    <div className="mt-3">
                                                        <Input
                                                            value={otherValues[field.id] || ''}
                                                            onChange={(e) => setOtherValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                                                            placeholder="Especifica tu respuesta..."
                                                            required
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto px-8"
                                >
                                    {isSubmitting ? (
                                        <>Enviando... <Loader2 className="w-4 h-4 ml-2 animate-spin" /></>
                                    ) : (
                                        <>Enviar Respuestas <ArrowRight className="w-4 h-4 ml-2" /></>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-12 text-center mt-10">
                <div className="px-6 flex flex-col items-center gap-4">
                    <p className="text-sm font-medium text-zinc-500">
                        Cuestionario enviado por <strong className="text-black dark:text-white">{isProOrPremium ? workspace?.name : 'Hi Krew'}</strong>.
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-100 dark:border-zinc-800">
                        Powered by
                        <img src="/HiKrewLogo.png" alt="Hi Krew" className="h-4 object-contain ml-1 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all dark:invert" />
                    </div>
                </div>
            </footer>
        </div>
    );
}
