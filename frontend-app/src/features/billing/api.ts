import api from '@/lib/api';
import {
    BillingStatus,
    BillingSubscription,
    SubscribeResponse,
    BillingInterval,
} from './types';

export const billingApi = {
    /**
     * Returns the current plan, planExpiresAt, active subscription, and prices.
     */
    getStatus: async (): Promise<BillingStatus> => {
        const response = await api.get<BillingStatus>('/billing/status');
        return response.data;
    },

    /**
     * Creates a Recurrente subscription checkout.
     * Returns the checkout URL to redirect the user.
     */
    subscribe: async (plan: 'pro' | 'premium', interval: BillingInterval): Promise<SubscribeResponse> => {
        const response = await api.post<SubscribeResponse>('/billing/subscribe', { plan, interval });
        return response.data;
    },

    /**
     * Cancels the active subscription.
     */
    cancel: async (): Promise<void> => {
        await api.post('/billing/cancel');
    },

    /**
     * Returns the billing history for the authenticated freelancer.
     */
    getHistory: async (): Promise<BillingSubscription[]> => {
        const response = await api.get<BillingSubscription[]>('/billing/history');
        return response.data;
    },
};
