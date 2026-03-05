'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';

interface IntegrationCardProps {
    logo: React.ReactNode;
    name: string;
    description: string;
    isConfigured: boolean;
    onConfigure: () => void;
    comingSoon?: boolean;
    proOnly?: boolean;
    userIsPro?: boolean;
    badges?: React.ReactNode[];
    disabledReason?: string;
}

export function IntegrationCard({
    logo,
    name,
    description,
    isConfigured,
    onConfigure,
    comingSoon = false,
    proOnly = false,
    userIsPro = true,
    badges,
    disabledReason,
}: IntegrationCardProps) {
    const { t } = useWorkspaceSettings();
    const isLocked = (proOnly && !userIsPro) || !!disabledReason;

    return (
        <Card className={`flex flex-col transition-all duration-300 ${comingSoon ? 'opacity-70 grayscale' : isLocked ? 'opacity-80' : 'hover:shadow-md hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                {/* Logo */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border flex items-center justify-center overflow-hidden p-2.5 shadow-sm transition-transform ${isLocked && !disabledReason ? 'grayscale' : 'group-hover:scale-105'}`}>
                    {logo}
                </div>

                {/* Status Badge */}
                <div className="flex items-center">
                    {comingSoon ? (
                        <Badge className="bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wider shadow-none">
                            Beta
                        </Badge>
                    ) : isConfigured ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/30 gap-1 text-[10px] font-medium px-2 py-0.5 shadow-sm uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" />
                            {t('integrations.connected')}
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-muted-foreground gap-1 text-[10px] font-medium px-2 py-0.5 uppercase tracking-wider shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                            {t('integrations.inactive')}
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-lg tracking-tight">
                            {name}
                        </CardTitle>
                        {badges && badges.length > 0 && (
                            <div className="flex items-center gap-1.5 ml-1">
                                {badges.map((badge, idx) => (
                                    <div key={idx} className="flex">{badge}</div>
                                ))}
                            </div>
                        )}
                    </div>
                    {proOnly && (
                        <Badge className="bg-amber-100/70 hover:bg-amber-100/70 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50 shadow-none text-[9px] font-bold px-1.5 py-0 uppercase tracking-widest leading-4">
                            PRO
                        </Badge>
                    )}
                </div>
                <CardDescription className="leading-relaxed line-clamp-3 text-sm">{description}</CardDescription>
            </CardContent>

            <CardFooter className="pt-4 border-t border-border/50">
                {isConfigured || comingSoon || isLocked ? (
                    <Button
                        variant={isConfigured ? 'outline' : 'secondary'}
                        className={`w-full gap-2 transition-all active:scale-[0.98] h-12 rounded-xl text-base`}
                        onClick={onConfigure}
                        disabled={comingSoon || isLocked}
                    >
                        {isLocked ? (disabledReason || t('integrations.requiresPro')) : comingSoon ? t('integrations.notAvailableYet') : t('integrations.configuration')}
                    </Button>
                ) : (
                    <PrimaryButton
                        className="w-full gap-2"
                        onClick={onConfigure}
                    >
                        {t('integrations.connectAccount')}
                        <ChevronRight className="w-4 h-4 ml-auto" />
                    </PrimaryButton>
                )}
            </CardFooter>
        </Card>
    );
}
