import api from '@/lib/api';

// ─── Brief types ──────────────────────────────────────────────────────────────

export type BriefFieldType = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'rating';

export interface BriefField {
    id: string;
    type: BriefFieldType;
    label: string;
    description?: string;
    tooltip?: string;
    required: boolean;
    options?: string[];
    allowOther?: boolean;
    dependsOn?: { fieldId: string; value: string };
}

export interface PublicBrief {
    isCompleted: boolean;
    template: {
        name: string;
        schema: BriefField[];
    };
}

// ─── Quotation types ──────────────────────────────────────────────────────────

export interface PublicDealQuotationItem {
    id: string;
    name: string;
    description?: string;
    quantity: number;
    price: number;
    subtotal: number;
    chargeType?: string;
    unitType?: string;
}

export interface PublicDealQuotation {
    id: string;
    optionName: string;
    description?: string;
    currency?: string;
    isApproved: boolean;
    subtotal: number;
    discount: number;
    taxTotal: number;
    total: number;
    items: PublicDealQuotationItem[];
}

// ─── Payment plan types ───────────────────────────────────────────────────────

export interface PublicDealMilestone {
    id: string;
    name: string;
    amount: number;
    percentage?: number;
    dueDate?: string;
    description?: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
}

// ─── Deal ─────────────────────────────────────────────────────────────────────

export interface PublicDealData {
    id: string;
    proposalIntro?: string;
    proposalTerms?: string;
    validUntil?: string;
    status?: string;
    client: { id?: string; name: string; email?: string };
    workspace: { businessName?: string; logo?: string; brandColor?: string };
    currency?: { symbol?: string; code?: string };
    brief?: PublicBrief;
    quotations?: PublicDealQuotation[];
    paymentPlan?: {
        id: string;
        milestones: PublicDealMilestone[];
    };
}

export type BriefResponses = Record<string, string | string[] | number>;

// ─── API ──────────────────────────────────────────────────────────────────────

export const publicDealsApi = {
    getDeal: (token: string, password?: string): Promise<PublicDealData> =>
        api.get(`/public/deals/${token}${password ? `?password=${encodeURIComponent(password)}` : ''}`).then(res => res.data),

    submitBrief: (token: string, responses: BriefResponses): Promise<void> =>
        api.post(`/public/briefs/${token}/submit`, { responses }).then(res => res.data),

    approveQuotation: (token: string, quotationId: string): Promise<void> =>
        api.post(`/public/deals/${token}/approve-quotation/${quotationId}`).then(res => res.data),
};
