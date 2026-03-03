export interface Workspace {
    id: string;
    businessName: string;
    logo?: string | null;
    brandColor?: string | null;
    plan: 'free' | 'pro' | 'premium';
    planExpiresAt?: string | null;
    quotesThisMonth: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    country?: string | null;
    state?: string | null;
    taxId?: string | null;
    taxType?: string | null;
    language?: string | null;
    timezone?: string | null;
    dateFormat?: string | null;
    timeFormat?: string | null;
    numberFormat?: string | null;
    currencyFormat?: string | null;
    firstDayOfWeek?: string | null;
    currencies?: { code: string; name: string; symbol: string; isDefault: boolean }[] | null;
    useCases?: string[] | null;
    onboardingCompleted?: boolean;
}

export interface WorkspaceMember {
    id: string;
    userId: string;
    workspaceId: string;
    role: 'owner' | 'collaborator' | 'guest';
    workspace: Workspace;
    createdAt: string;
    updatedAt: string;
}
