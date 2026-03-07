'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DealRoadmapSidebar } from './DealRoadmapSidebar';
import { DealCanvas } from './DealCanvas';
import { useDeals } from '@/hooks/use-deals';
import { toast } from 'sonner';

export type DealStep = 'brief' | 'quotation' | 'payment_plan' | 'won';

export interface DealDataMock {
    id: string;
    title: string;
    status: 'draft' | 'pending' | 'won' | 'lost';
    brief: { completed: boolean; updatedAt?: string; templateId?: string };
    quotation: { total?: number; approved: boolean };
    paymentPlan: { milestonesCount: number; configured: boolean };
    currentStep: DealStep;
}

interface DealBuilderProps {
    dealId: string;
}

export function DealBuilder({ dealId }: DealBuilderProps) {
    const router = useRouter();

    // Mock state for now
    const [dealData, setDealData] = useState<DealDataMock>({
        id: dealId,
        title: dealId === 'new' ? 'Nueva Propuesta' : `Propuesta #${dealId}`,
        status: 'draft',
        brief: { completed: false },
        quotation: { approved: false },
        paymentPlan: { milestonesCount: 0, configured: false },
        currentStep: 'brief', // default start is brief
    });

    const [activeStep, setActiveStep] = useState<DealStep>(dealData.currentStep);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from local storage
    React.useEffect(() => {
        const savedData = localStorage.getItem(`deal_mock_${dealId}`);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setDealData(parsed);
                setActiveStep(parsed.currentStep);
            } catch (e) {
                console.error("Failed to parse saved deal data", e);
            }
        }
        setIsLoaded(true);
    }, [dealId]);

    // Save to local storage on change
    React.useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(`deal_mock_${dealId}`, JSON.stringify(dealData));
        }
    }, [dealData, dealId, isLoaded]);

    const { updateDeal } = useDeals();

    // This checks if the user clicks a step in the sidebar
    const handleStepChange = async (step: DealStep) => {
        // Enforce logic if step is locked, etc...
        setActiveStep(step);
        if (dealId !== 'new') {
            await updateDeal(dealId, { currentStep: step });
        }
    };

    const handleWon = async () => {
        setDealData(prev => ({ ...prev, status: 'won', currentStep: 'won' }));
        setActiveStep('won');
        if (dealId !== 'new') {
            await updateDeal(dealId, { status: 'won', currentStep: 'won' });
            toast.success('¡Trato marcado como ganado!');
        }
    };

    const handleUpdateBrief = async (templateId: string | null) => {
        setDealData(prev => ({
            ...prev,
            brief: { ...prev.brief, templateId: templateId || undefined, completed: !!templateId },
            currentStep: templateId ? 'quotation' : 'brief'
        }));

        if (dealId !== 'new') {
            await updateDeal(dealId, { briefTemplateId: templateId || undefined, currentStep: templateId ? 'quotation' : 'brief' });
        }
    };

    if (!isLoaded) return null; // Wait for hydration

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] w-full overflow-hidden bg-white dark:bg-zinc-950">
            {/* 25% Sidebar Roadmap */}
            <div className="md:w-1/4 w-full border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 overflow-y-auto">
                <DealRoadmapSidebar
                    dealData={dealData}
                    activeStep={activeStep}
                    onStepChange={handleStepChange}
                />
            </div>

            {/* 75% Working Canvas */}
            <div className="md:w-3/4 w-full h-full relative bg-zinc-50 dark:bg-zinc-950 overflow-y-auto">
                <DealCanvas
                    dealData={dealData}
                    activeStep={activeStep}
                    onWon={handleWon}
                    onNextStep={(next: DealStep) => setActiveStep(next)}
                    onUpdateBrief={handleUpdateBrief}
                />
            </div>
        </div>
    );
}
