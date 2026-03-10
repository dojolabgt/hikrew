'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DealRoadmapSidebar } from './DealRoadmapSidebar';
import { DealCanvas } from './DealCanvas';
import { useDeals } from '@/hooks/use-deals';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type DealStep = 'brief' | 'quotation' | 'payment_plan' | 'won';

interface DealBuilderProps {
    dealId: string;
}

export function DealBuilder({ dealId }: DealBuilderProps) {
    const router = useRouter();
    const { fetchDeal, updateDeal } = useDeals();

    const [deal, setDeal] = useState<any | null>(null);
    const [activeStep, setActiveStep] = useState<DealStep>('brief');
    const [isLoading, setIsLoading] = useState(true);
    const [showWonDialog, setShowWonDialog] = useState(false);

    const loadDeal = useCallback(async () => {
        setIsLoading(true);
        const data = await fetchDeal(dealId);
        if (data) {
            setDeal(data);
            setActiveStep((data.currentStep as DealStep) || 'brief');
        }
        setIsLoading(false);
    }, [dealId, fetchDeal]);

    useEffect(() => {
        loadDeal();
    }, [loadDeal]);

    const handleStepChange = async (step: DealStep) => {
        setActiveStep(step);
        await updateDeal(dealId, { currentStep: step });
        // Keep local deal state in sync so the sidebar's isLocked logic reflects the new currentStep
        setDeal((prev: any) => ({ ...prev, currentStep: step }));
    };

    const handleUpdateBrief = async (templateId: string | null) => {
        // Step 1 is optional — always advance to quotation regardless of templateId
        const updated = await updateDeal(dealId, {
            briefTemplateId: templateId || undefined,
            currentStep: 'quotation',
        });
        if (updated) {
            // Reload full deal so brief.template relation is populated
            const fresh = await fetchDeal(dealId);
            setDeal(fresh || updated);
            setActiveStep('quotation');
        }
    };

    // Silent re-fetch — used by children after mutations so sidebar/state stays in sync
    const refreshDeal = useCallback(async () => {
        const data = await fetchDeal(dealId);
        if (data) setDeal(data);
    }, [dealId, fetchDeal]);

    const handleWon = async () => {
        const updated = await updateDeal(dealId, { status: 'WON', currentStep: 'won' });
        if (updated) {
            setDeal(updated);
            setActiveStep('won');
            toast.success('¡Trato marcado como Ganado! 🎉');
        }
        setShowWonDialog(false);
    };

    const handleDealUpdate = (updated: any) => {
        setDeal(updated);
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-zinc-400">
                    <div className="w-8 h-8 border-2 border-zinc-300 border-t-primary rounded-full animate-spin" />
                    <span className="text-sm">Cargando propuesta...</span>
                </div>
            </div>
        );
    }

    if (!deal) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center text-zinc-500">
                <p>Propuesta no encontrada.</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] w-full overflow-hidden bg-white dark:bg-zinc-950">
                {/* 25% Sidebar Roadmap */}
                <div className="md:w-1/4 w-full border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 overflow-y-auto">
                    <DealRoadmapSidebar
                        deal={deal}
                        activeStep={activeStep}
                        onStepChange={handleStepChange}
                        updateDeal={updateDeal}
                    />
                </div>

                {/* 75% Working Canvas */}
                <div className="md:w-3/4 w-full h-full relative bg-zinc-50 dark:bg-zinc-950 overflow-y-auto">
                    <DealCanvas
                        deal={deal}
                        activeStep={activeStep}
                        onWon={() => setShowWonDialog(true)}
                        onNextStep={handleStepChange}
                        onUpdateBrief={handleUpdateBrief}
                        onDealUpdate={handleDealUpdate}
                        onRefreshDeal={refreshDeal}
                    />
                </div>
            </div>

            {/* WON Confirmation Dialog */}
            <AlertDialog open={showWonDialog} onOpenChange={setShowWonDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Marcar como Ganado?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción cerrará el trato como <strong>Ganado (WON)</strong>. El brief, la cotización y el plan de pagos quedarán en modo de solo lectura. ¿Deseas continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={handleWon}
                        >
                            Sí, marcar como Ganado 🎉
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
