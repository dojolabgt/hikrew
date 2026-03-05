'use client';

import React from 'react';
import { DealDataMock, DealStep } from './DealBuilder';
import { Button } from '@/components/ui/button';
import { ChevronRight, Save, ShieldAlert, FileEdit } from 'lucide-react';
import { BriefStep } from './steps/BriefStep';

interface CanvasProps {
    dealData: DealDataMock;
    activeStep: DealStep;
    onNextStep: (step: DealStep) => void;
    onUpdateBrief: (templateId: string) => void;
    onWon: () => void;
}

export function DealCanvas({ dealData, activeStep, onNextStep, onUpdateBrief, onWon }: CanvasProps) {
    const isWon = dealData.status === 'won';
    const [localSelectedTemplateId, setLocalSelectedTemplateId] = React.useState<string | null>(dealData.brief.templateId || null);

    // Determine if we are viewing a past step
    const indexMap: Record<DealStep, number> = { 'brief': 0, 'quotation': 1, 'payment_plan': 2, 'won': 3 };
    const currentIndex = indexMap[activeStep];
    const dealStepIndex = indexMap[dealData.currentStep];

    // It's considered a snapshot if we are viewing a completed step and the deal is further along
    const isSnapshot = currentIndex < dealStepIndex && !isWon;

    const renderHeader = () => {
        let title = '';
        let stepNum = 1;

        switch (activeStep) {
            case 'brief': title = 'Cuestionario Brief'; stepNum = 1; break;
            case 'quotation': title = 'Configurando Cotización'; stepNum = 2; break;
            case 'payment_plan': title = 'Plan de Pagos'; stepNum = 3; break;
            case 'won': title = '¡Trato Ganado!'; stepNum = 4; break;
        }

        if (activeStep === 'won') return null; // No header for WON state graphic

        return (
            <div className="flex items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        {isSnapshot ? 'Visualizando Snapshot Histórico' : `Paso ${stepNum} de 3`}
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
                        {title}
                    </h1>
                </div>

                {isSnapshot && (
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-800/50">
                            <ShieldAlert className="w-3.5 h-3.5" /> Sólo Lectura
                        </span>
                        <Button variant="outline" size="sm" className="hidden md:flex">
                            <FileEdit className="w-4 h-4 mr-2" />
                            Crear nueva versión
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    const renderFooter = () => {
        if (activeStep === 'won' || isSnapshot) return null;

        return (
            <div className="flex items-center justify-between p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 mt-auto">
                <Button variant="ghost" className="text-zinc-500">
                    <Save className="w-4 h-4 mr-2" /> Guardar Borrador
                </Button>

                {activeStep === 'payment_plan' ? (
                    <Button
                        onClick={onWon}
                        className="bg-primary hover:bg-primary/90 shadow-md transition-all active:scale-95"
                    >
                        Marcar como Ganado (WON) <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button
                        onClick={() => {
                            if (activeStep === 'brief') {
                                if (localSelectedTemplateId) {
                                    onUpdateBrief(localSelectedTemplateId);
                                    onNextStep('quotation');
                                } else {
                                    alert('Por favor selecciona o guarda una plantilla primero.');
                                }
                            }
                            else if (activeStep === 'quotation') onNextStep('payment_plan');
                        }}
                        className="transition-all active:scale-95"
                    >
                        Continuar <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950 relative">
            {/* Main Content Area */}
            <div className="flex-1 p-6 md:p-10 overflow-y-auto">
                {renderHeader()}

                <div className="mt-8">
                    {activeStep === 'brief' && (
                        <BriefStep
                            initialSelectedTemplateId={localSelectedTemplateId}
                            onSelectTemplate={setLocalSelectedTemplateId}
                        />
                    )}

                    {activeStep === 'quotation' && (
                        <div className="h-96 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                            [ Componente Constructor de Cotización Multiopción ]
                        </div>
                    )}

                    {activeStep === 'payment_plan' && (
                        <div className="h-96 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                            [ Componente Plan de Hitos Financieros ]
                        </div>
                    )}

                    {activeStep === 'won' && (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                                <span className="text-4xl text-emerald-600 dark:text-emerald-400">🎉</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
                                ¡Propuesta Aceptada!
                            </h2>
                            <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-8">
                                La lógica de negocio separa ahora este Deal de su ejecución.
                                Automáticamente se ha generado el placeholder del Proyecto con los estados financieros iniciales heredados del plan de pagos.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Footer */}
            {renderFooter()}

            {/* Read-Only Watermark Overlay (Optional visual effect) */}
            {isSnapshot && (
                <div className="absolute inset-0 pointer-events-none bg-zinc-50/30 dark:bg-zinc-900/10 backdrop-blur-[1px] z-10" />
            )}
        </div>
    );
}
