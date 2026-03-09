'use client';

import React from 'react';
import { DealStep } from './DealBuilder';
import { Button } from '@/components/ui/button';
import { ChevronRight, Save, ShieldAlert } from 'lucide-react';
import { BriefStep } from './steps/BriefStep';
import { QuotationStep } from './steps/QuotationStep';
import { PaymentPlanStep } from './steps/PaymentPlanStep';
import { toast } from 'sonner';
import { useDeals } from '@/hooks/use-deals';

interface CanvasProps {
    deal: any;
    activeStep: DealStep;
    onNextStep: (step: DealStep) => void;
    onUpdateBrief: (templateId: string | null) => void;
    onWon: () => void;
    onDealUpdate: (deal: any) => void;
    onRefreshDeal: () => Promise<void>;
}

export function DealCanvas({ deal, activeStep, onNextStep, onUpdateBrief, onWon, onDealUpdate, onRefreshDeal }: CanvasProps) {
    const { updateDeal } = useDeals();
    const [pendingBriefId, setPendingBriefId] = React.useState<string | null>(deal?.brief?.template?.id || null);
    const isWon = deal?.status === 'WON';

    const indexMap: Record<DealStep, number> = { brief: 0, quotation: 1, payment_plan: 2, won: 3 };
    const currentIndex = indexMap[activeStep];
    const dealStepIndex = indexMap[(deal?.currentStep as DealStep) || 'brief'];
    const isSnapshot = isWon && activeStep !== 'won';

    const handleSaveDraft = async () => {
        await updateDeal(deal.id, { currentStep: activeStep });
        toast.success('Borrador guardado');
    };

    const renderHeader = () => {
        const titles: Record<DealStep, string> = {
            brief: 'Cuestionario Brief',
            quotation: 'Configurando Cotización',
            payment_plan: 'Plan de Pagos',
            won: '¡Trato Ganado!',
        };
        const stepNums: Record<DealStep, number> = { brief: 1, quotation: 2, payment_plan: 3, won: 4 };

        if (activeStep === 'won') return null;

        return (
            <div className="flex items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        {isSnapshot ? 'Visualizando Snapshot Histórico' : `Paso ${stepNums[activeStep]} de 3`}
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
                        {titles[activeStep]}
                    </h1>
                    {deal?.client?.name && (
                        <p className="text-sm text-zinc-500 mt-0.5">Para: <span className="font-medium text-zinc-700 dark:text-zinc-300">{deal.client.name}</span></p>
                    )}
                </div>

                {isSnapshot && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-800/50">
                        <ShieldAlert className="w-3.5 h-3.5" /> Sólo Lectura
                    </span>
                )}
            </div>
        );
    };

    const renderFooter = () => {
        if (activeStep === 'won' || isSnapshot) return null;

        return (
            <div className="flex items-center justify-between p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 mt-auto">
                <Button variant="ghost" className="text-zinc-500" onClick={handleSaveDraft}>
                    <Save className="w-4 h-4 mr-2" /> Guardar Borrador
                </Button>

                {activeStep === 'payment_plan' ? (
                    <Button
                        onClick={onWon}
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                    >
                        Marcar como Ganado <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button
                        onClick={() => {
                            if (activeStep === 'brief') {
                                // Step 1 is optional — pass pendingBriefId (may be null)
                                onUpdateBrief(pendingBriefId);
                            } else if (activeStep === 'quotation') {
                                onNextStep('payment_plan');
                            }
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
            <div className="flex-1 p-6 md:p-10 overflow-y-auto">
                {renderHeader()}

                <div className="mt-8">
                    {activeStep === 'brief' && (
                        <BriefStep
                            initialSelectedTemplateId={pendingBriefId}
                            onSelectTemplate={(id) => {
                                // Only update local pending state; actual save happens on "Continuar"
                                setPendingBriefId(id);
                            }}
                        />
                    )}

                    {activeStep === 'quotation' && (
                        <QuotationStep
                            dealId={deal.id}
                            currency={deal.currency}
                            taxes={deal.taxes}
                            readonly={isSnapshot}
                            onUpdate={onRefreshDeal}
                        />
                    )}

                    {activeStep === 'payment_plan' && (
                        <PaymentPlanStep
                            dealId={deal.id}
                            quotations={deal.quotations || []}
                            readonly={isSnapshot}
                        />
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
                                El trato ha sido marcado como ganado. El brief, la cotización y el plan de pagos quedan guardados como registro histórico.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {renderFooter()}

            {isSnapshot && (
                <div className="absolute inset-0 pointer-events-none bg-zinc-50/10 dark:bg-zinc-900/10 z-10" />
            )}
        </div>
    );
}
