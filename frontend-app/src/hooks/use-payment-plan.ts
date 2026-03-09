import { useState, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import api from '@/lib/api';

export interface PaymentMilestone {
    id: string;
    name: string;
    percentage?: number;
    amount: number;
    description?: string;
    dueDate?: string;
    status: string;
}

export interface PaymentPlan {
    id: string;
    quotationId?: string;
    totalAmount: number;
    milestones: PaymentMilestone[];
}

export interface CreatePaymentPlanPayload {
    quotationId?: string;
    milestones: {
        name: string;
        percentage?: number;
        amount: number;
        description?: string;
        dueDate?: string;
    }[];
}

export interface CreateMilestonePayload {
    name: string;
    percentage?: number;
    amount: number;
    description?: string;
    dueDate?: string;
}

export interface UpdateMilestonePayload extends Partial<CreateMilestonePayload> {
    status?: string;
}

export function usePaymentPlan(dealId: string) {
    const { activeWorkspace } = useAuth();
    const [plan, setPlan] = useState<PaymentPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const base = () => `/workspaces/${activeWorkspace?.id}/deals/${dealId}/payment-plan`;

    const fetchPaymentPlan = useCallback(async () => {
        if (!activeWorkspace || !dealId) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get(base());
            setPlan(res.data);
            return res.data;
        } catch (err: any) {
            if (err.response?.status !== 404) {
                setError(err.response?.data?.message || err.message);
            }
            // If 404, it just means no plan exists yet, which is fine
            setPlan(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [activeWorkspace, dealId]);

    const createOrUpdatePlan = useCallback(async (payload: CreatePaymentPlanPayload) => {
        if (!activeWorkspace) return null;
        setIsLoading(true);
        try {
            const res = await api.post(base(), payload);
            setPlan(res.data);
            return res.data;
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [activeWorkspace, dealId]);

    const addMilestone = useCallback(async (payload: CreateMilestonePayload) => {
        if (!activeWorkspace) return null;
        setIsLoading(true);
        try {
            const res = await api.post(`${base()}/milestones`, payload);
            setPlan(res.data);
            return res.data;
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [activeWorkspace, dealId]);

    const updateMilestone = useCallback(async (milestoneId: string, payload: UpdateMilestonePayload) => {
        if (!activeWorkspace) return null;
        setIsLoading(true);
        try {
            const res = await api.patch(`${base()}/milestones/${milestoneId}`, payload);
            return res.data;
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [activeWorkspace, dealId]);

    const deleteMilestone = useCallback(async (milestoneId: string) => {
        if (!activeWorkspace) return false;
        setIsLoading(true);
        try {
            await api.delete(`${base()}/milestones/${milestoneId}`);
            return true;
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [activeWorkspace, dealId]);

    return {
        plan,
        paymentPlan: plan,         // alias used by PaymentPlanStep
        setPlan,
        fetchPaymentPlan,
        createOrUpdatePlan,
        createPaymentPlan: createOrUpdatePlan, // alias used by PaymentPlanStep
        addMilestone,
        updateMilestone,
        deleteMilestone,
        isLoading,
        error,
        setError,
    };
}
