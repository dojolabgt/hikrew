import api from '@/lib/api';

export interface PortalQuotation {
    id: string;
    optionName: string;
    description?: string;
    isApproved: boolean;
    subtotal: number;
    discount: number;
    taxTotal: number;
    total: number;
    currency?: string;
    items: { id: string; name: string; description?: string; quantity: number; price: number; subtotal: number }[];
}

export interface PortalMilestone {
    id: string;
    name: string;
    amount: number;
    percentage?: number;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    dueDate?: string;
    description?: string;
}

export interface PortalDeal {
    id: string;
    publicToken: string;
    name?: string;
    status: string;
    createdAt: string;
    proposalIntro?: string;
    proposalTerms?: string;
    validUntil?: string;
    currency?: { symbol?: string; code?: string };
    workspace: {
        businessName?: string;
        logo?: string;
        brandColor?: string;
    };
    brief?: {
        isCompleted: boolean;
        publicToken?: string;
    };
    quotations?: PortalQuotation[];
    paymentPlan?: {
        milestones: PortalMilestone[];
    };
}

export interface PortalDealDetail extends PortalDeal {
    client?: { name: string; email?: string };
    brief?: {
        isCompleted: boolean;
        publicToken?: string;
        responses?: Record<string, unknown>;
        template?: {
            name: string;
            schema: Array<{
                id: string;
                type: string;
                label: string;
                description?: string;
                required: boolean;
                options?: Array<string | { label: string; value: string }>;
                allowOther?: boolean;
                dependsOn?: { fieldId: string; value: string };
            }>;
        };
    };
    project?: {
        id: string;
        name: string;
        status: 'active' | 'completed' | 'cancelled';
        driveFolderId?: string;
        driveFolderUrl?: string;
    };
}

export interface PortalAsset {
    id: string;
    name: string;
    mimeType: string;
    webViewLink: string;
    size?: string;
    createdTime: string;
}

export const portalApi = {
    getDeals: (): Promise<PortalDeal[]> =>
        api.get('/portal/deals').then((res) => res.data),

    getDeal: (token: string): Promise<PortalDealDetail> =>
        api.get(`/portal/deals/${token}`).then((res) => res.data),

    getAssets: (token: string): Promise<PortalAsset[]> =>
        api.get(`/portal/deals/${token}/assets`).then((res) => res.data),

    uploadAsset: async (token: string, file: File): Promise<PortalAsset> => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/portal/deals/${token}/assets`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then((res) => res.data);
    },
};
