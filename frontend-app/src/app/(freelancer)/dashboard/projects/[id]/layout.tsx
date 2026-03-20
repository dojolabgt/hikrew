'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useProjects } from '@/hooks/use-projects';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, CreditCard, FolderOpen, CheckSquare, Folder } from 'lucide-react';
import { EditProjectDialog } from './_components/EditProjectDialog';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useWorkspaceSettings } from '@/hooks/use-workspace-settings';

export interface ProjectBriefData {
    id: string;
    name: string;
    sortOrder: number;
    isCompleted: boolean;
    templateId?: string | null;
    templateSnapshot?: { id: string; label: string; type: string; options?: string[]; required?: boolean }[];
    responses?: Record<string, string | string[]>;
    createdAt: string;
}

export interface DirectPaymentPlan {
    id: string;
    totalAmount: number;
    billingCycle?: 'one_time' | 'monthly' | 'quarterly' | 'annual' | null;
    stripeSubscriptionId?: string | null;
    stripePriceId?: string | null;
    milestones: {
        id: string;
        name: string;
        amount: number;
        percentage?: number;
        status: string;
        dueDate?: string;
        description?: string;
        splits?: { id: string; collaboratorWorkspaceId: string; amount: number; percentage?: number; collaboratorWorkspace?: { businessName?: string; name?: string } }[];
    }[];
}

export interface ProjectData {
    id: string;
    name: string;
    status: string;
    description?: string | null;
    currency?: string | null;
    budget?: number | null;
    workspaceId: string;
    workspace?: { id: string; name?: string; businessName?: string };
    dealId?: string | null;
    deal?: {
        id?: string;
        publicToken?: string;
        proposalIntro?: string;
        currency?: { code?: string; symbol?: string; name?: string };
        client?: { name: string; email?: string; whatsapp?: string };
        quotations?: {
            isApproved?: boolean;
            optionName?: string;
            description?: string;
            currency?: string;
            total?: number;
            items?: { name: string; quantity: string | number; price: string | number }[];
        }[];
        brief?: {
            template?: { name: string; schema: { id: string; label: string }[] };
            responses?: Record<string, string | string[]>;
        };
        paymentPlan?: {
            id: string;
            totalAmount: number;
            billingCycle?: string | null;
            milestones: {
                id: string; name: string; amount: number; percentage?: number;
                status: string; dueDate?: string; description?: string;
                splits?: { id: string; collaboratorWorkspaceId: string; amount: number; percentage?: number; collaboratorWorkspace?: { businessName?: string; name?: string } }[];
            }[];
        };
    } | null;
    client?: { id?: string; name?: string; email?: string; phone?: string } | null;
    clientId?: string | null;
    briefs?: ProjectBriefData[];
    directPaymentPlan?: DirectPaymentPlan | null;
    collaborators?: { id: string; workspace: { id: string; businessName?: string; logo?: string; name?: string }; role: string }[];
    driveFolderId?: string | null;
    driveFolderUrl?: string | null;
    [key: string]: unknown;
}

interface ProjectContextType {
    project: ProjectData;
    isOwner: boolean;
    isViewer: boolean;
    refreshProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function useProject() {
    const context = useContext(ProjectContext);
    if (!context) throw new Error('useProject must be used within a Project Layout');
    return context;
}

/** Returns the client name regardless of whether project came from a deal or is standalone. */
export function getProjectClientName(project: ProjectData, fallback = ''): string {
    return project.deal?.client?.name ?? project.client?.name ?? fallback;
}

/** Returns the display value/budget string for the project. */
export function getProjectValue(
    project: ProjectData,
    currencySymbol: string,
): string | null {
    // Deal-based: use approved quotation
    if (project.deal?.quotations?.length) {
        const q =
            project.deal.quotations.find((q) => q.isApproved) ?? project.deal.quotations[0];
        if (q?.total) {
            return `${currencySymbol}${Number(q.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        }
    }
    // Standalone: use budget
    if (project.budget) {
        return `${currencySymbol}${Number(project.budget).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }
    return null;
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const projectId = params.id as string;

    const { activeWorkspace } = useAuth();
    const { t } = useWorkspaceSettings();
    const { fetchProject, isLoading } = useProjects();
    const [project, setProject] = useState<ProjectData | null>(null);

    const loadProject = async () => {
        if (!activeWorkspace || !projectId) return;
        const data = await fetchProject(projectId);
        if (data) setProject(data as ProjectData);
    };

    useEffect(() => {
        loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeWorkspace, projectId]);

    if (isLoading || !project) {
        return (
            <DashboardShell>
                <div className="flex h-[50vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-zinc-400">
                        <div className="w-8 h-8 border-2 border-zinc-300 border-t-primary rounded-full animate-spin" />
                        <span className="text-sm">{t('projects.loadingProject')}</span>
                    </div>
                </div>
            </DashboardShell>
        );
    }

    const isOwner = project.workspaceId === activeWorkspace?.id;
    const collabMatch = project.collaborators?.find((c) => c.workspace.id === activeWorkspace?.id);
    const isViewer = !isOwner && collabMatch?.role === 'viewer';
    const isCompleted = project.status === 'COMPLETED';
    const isStandalone = !project.dealId;

    // Currency symbol resolution
    const getCurrencySymbol = () => {
        const currCode = project.deal?.currency?.code ?? project.currency;
        if (project.deal?.currency?.symbol) return project.deal.currency.symbol;
        if (currCode && activeWorkspace?.currencies) {
            const found = activeWorkspace.currencies.find((c: { code: string; symbol: string }) => c.code === currCode);
            if (found) return found.symbol;
        }
        const fallbacks: Record<string, string> = {
            GTQ: 'Q', USD: '$', EUR: '€', MXN: '$', GBP: '£', JPY: '¥',
            CAD: '$', AUD: '$', CHF: 'Fr', BRL: 'R$', COP: '$',
        };
        return fallbacks[currCode ?? ''] ?? '$';
    };

    const currencySymbol = getCurrencySymbol();
    const clientName = getProjectClientName(project, t('projects.defaultClientName'));
    const valueDisplay = getProjectValue(project, currencySymbol);

    // Badge counts derived from project data
    const pendingMilestones = (() => {
        const ms = project.directPaymentPlan?.milestones ?? project.deal?.paymentPlan?.milestones ?? [];
        return ms.filter((m) => m.status === 'PENDING' || m.status === 'OVERDUE').length;
    })();
    const incompleteBriefs = (project.briefs ?? []).filter((b) => !b.isCompleted).length;

    const tabs = [
        { name: t('projects.tabOverview'), href: `/dashboard/projects/${projectId}`, icon: Folder, badge: 0, badgeColor: '' },
        { name: t('projects.tabTasks'), href: `/dashboard/projects/${projectId}/tasks`, icon: CheckSquare, badge: 0, badgeColor: '' },
        { name: t('projects.tabAssets'), href: `/dashboard/projects/${projectId}/assets`, icon: FolderOpen, badge: incompleteBriefs, badgeColor: 'violet' },
        { name: t('projects.tabPayments'), href: `/dashboard/projects/${projectId}/payments`, icon: CreditCard, badge: pendingMilestones, badgeColor: 'amber' },
        { name: t('projects.tabCollaborators'), href: `/dashboard/projects/${projectId}/team`, icon: Users, badge: 0, badgeColor: '' },
    ];

    return (
        <ProjectContext.Provider value={{ project, isOwner, isViewer, refreshProject: loadProject }}>
            <DashboardShell>
                {/* Back */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="mb-5 -ml-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    onClick={() => router.push('/dashboard/projects')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> {t('projects.backBtn')}
                </Button>

                {/* Hero header */}
                <div
                    className={cn(
                        'rounded-2xl border p-6 mb-6 transition-colors',
                        isCompleted
                            ? 'bg-zinc-50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800'
                            : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50',
                    )}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div
                                className={cn(
                                    'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                                    isCompleted
                                        ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                                        : 'bg-emerald-200 dark:bg-emerald-800/60 text-emerald-700 dark:text-emerald-400',
                                )}
                            >
                                <Folder className="w-6 h-6" />
                            </div>

                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">
                                        {project.name}
                                    </h1>
                                    {isOwner && (
                                        <EditProjectDialog project={project} onSaved={loadProject} />
                                    )}
                                    <span
                                        className={cn(
                                            'px-2 py-0.5 rounded-md text-xs font-semibold',
                                            isCompleted
                                                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                                : 'bg-emerald-200 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-300',
                                        )}
                                    >
                                        {isCompleted
                                            ? t('projects.statusCompleted')
                                            : t('projects.statusActive')}
                                    </span>
                                    {isStandalone && (
                                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                                            {t('projects.standaloneTag')}
                                        </span>
                                    )}
                                    {!isOwner && (
                                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                            {t('projects.collaboratorBadge')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    {clientName !== t('projects.defaultClientName') ? (
                                        <>
                                            {t('projects.clientLabel')}{' '}
                                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                                {clientName}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="italic opacity-70">{t('projects.noClientAssigned')}</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {valueDisplay && (
                            <div className="text-right shrink-0">
                                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                                    {t('projects.valueLabel')}
                                </p>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                                    {valueDisplay}
                                </p>
                                <p className="text-xs text-zinc-400">
                                    {project.deal?.currency?.code ?? project.currency ?? ''}
                                </p>
                            </div>
                        )}
                    </div>

                    {project.description && (
                        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-200/70 dark:border-zinc-700/40 pt-4">
                            {project.description}
                        </p>
                    )}
                </div>

                {/* Navigation Tabs */}
                <div className="flex space-x-0.5 mb-6 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={cn(
                                    'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                                    isActive
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-300 dark:hover:border-zinc-700',
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.name}
                                {tab.badge > 0 && (
                                    <span className={cn(
                                        'w-2 h-2 rounded-full shrink-0',
                                        tab.badgeColor === 'amber' ? 'bg-amber-400' : 'bg-violet-500',
                                    )} />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {children}
            </DashboardShell>
        </ProjectContext.Provider>
    );
}
