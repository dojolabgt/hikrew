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
