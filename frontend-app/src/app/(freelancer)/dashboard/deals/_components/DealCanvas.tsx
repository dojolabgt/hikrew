'use client';

import React from 'react';
import { DealStep } from './DealBuilder';
import { Button } from '@/components/ui/button';
import { ChevronRight, ShieldAlert, AlertTriangle } from 'lucide-react';
import { BriefStep } from './steps/BriefStep';
import { QuotationStep } from './steps/QuotationStep';
import { PaymentPlanStep } from './steps/PaymentPlanStep';
import { useDeals } from '@/hooks/use-deals';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';

interface CanvasProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deal: Record<string, any>;
    activeStep: DealStep;
    onNextStep: (step: DealStep) => void;
    onUpdateBrief: (templateId: string | null) => void;
    onWon: () => void;
    onRefreshDeal: () => Promise<void>;
}

export function DealCanvas({ deal, activeStep, onNextStep, onUpdateBrief, onWon, onRefreshDeal }: CanvasProps) {
    const { updateDeal } = useDeals();
    const { activeWorkspace } = useAuth();
    const { t } = useWorkspaceSettings();
    const [pendingBriefId, setPendingBriefId] = React.useState<string | null>(deal?.brief?.template?.id || null);
    const isWon = deal?.status === 'WON';


    const isViewer = React.useMemo(() => {
        if (!activeWorkspace || !deal?.collaborators) return false;
        const collab = deal.collaborators.find((c: { workspace: { id: string }, role: string }) => c.workspace.id === activeWorkspace.id);
        return collab?.role === 'viewer';
    }, [activeWorkspace, deal]);

    const isSnapshot = isWon && activeStep !== 'won';
    const isReadonly = isSnapshot || isViewer;

    const renderHeader = () => {
        const titles: Record<DealStep, string> = {
            brief: t('deals.stepBriefTitle'),
            quotation: t('deals.stepQuotationTitle'),
            payment_plan: t('deals.stepPaymentTitle'),
            won: t('deals.stepWonTitle'),
        };
        const stepNums: Record<DealStep, number> = { brief: 1, quotation: 2, payment_plan: 3, won: 4 };

        if (activeStep === 'won') return null;

        return (
            <div className="flex items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        {isSnapshot ? t('deals.snapshotLabel') : `Paso ${stepNums[activeStep]} de 3`}
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
                        {titles[activeStep]}
                    </h1>
                    {deal?.client?.name && (
                        <p className="text-sm text-zinc-500 mt-0.5">{t('deals.forLabel')} <span className="font-medium text-zinc-700 dark:text-zinc-300">{deal.client.name}</span></p>
                    )}
                </div>

                {isReadonly && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-800/50">
                        <ShieldAlert className="w-3.5 h-3.5" /> {t('deals.readOnlyLabel')}
                    </span>
                )}
            </div>
        );
    };

    const renderFooter = () => {
        if (activeStep === 'won' || isReadonly) return null;

        return (
            <div className="flex items-center justify-end p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 mt-auto">

                {activeStep === 'payment_plan' ? (
                    <div className="flex flex-col items-end gap-2 w-full">
                        {!deal?.paymentPlan && (
                            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 w-full">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>{t('deals.wonNoPlanWarning')}</span>
                            </div>
                        )}
                        <Button
                            onClick={onWon}
                            className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                        >
                            {t('deals.markAsWonBtn')} <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        {activeStep === 'brief' && !deal?.brief?.isCompleted && (
                            <Button
                                variant="ghost"
                                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all"
                                onClick={() => onNextStep('quotation')}
                            >
                                {t('deals.skipStep')}
                            </Button>
                        )}
                        <Button
                            onClick={() => {
                                if (activeStep === 'brief') {
                                    onUpdateBrief(pendingBriefId);
                                } else if (activeStep === 'quotation') {
                                    onNextStep('payment_plan');
                                }
                            }}
                            className="transition-all active:scale-95"
                            disabled={
                                (activeStep === 'brief' && (pendingBriefId || deal?.brief) && !deal?.brief?.isCompleted) ||
                                (activeStep === 'quotation' && (!deal?.quotations || deal.quotations.length === 0))
                            }
                        >
                            {t('deals.continueBtn')} <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
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
                            publicToken={deal?.publicToken}
                            isCompleted={deal?.brief?.isCompleted}
                            responses={deal?.brief?.responses}
                            onSelectTemplate={(id) => {
                                if (isReadonly) return;
                                setPendingBriefId(id);
                                // Auto-save selection to db immediately so the link generates and steps lock properly
                                updateDeal(deal.id, { briefTemplateId: id || undefined }).then(() => {
                                    onRefreshDeal();
                                });
                            }}
                            workspaceId={deal?.workspace?.id || deal?.workspaceId}
                            readonly={isReadonly}
                        />
                    )}

                    {activeStep === 'quotation' && (
                        <QuotationStep
                            deal={deal}
                            dealId={deal.id}
                            publicToken={deal.publicToken}
                            currency={deal.currency}
                            readonly={isReadonly}
                            onUpdate={onRefreshDeal}
                            updateDeal={updateDeal}
                        />
                    )}

                    {activeStep === 'payment_plan' && (
                        <PaymentPlanStep
                            dealId={deal.id}
                            quotations={deal.quotations || []}
                            currency={deal.currency}
                            readonly={isReadonly}
                            deal={deal}
                        />
                    )}

                    {activeStep === 'won' && (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                                <span className="text-4xl text-emerald-600 dark:text-emerald-400">🎉</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
                                {t('deals.wonTitle')}
                            </h2>
                            <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-8">
                                {t('deals.wonDesc')}
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
