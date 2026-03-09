import { useState, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import api from '@/lib/api';

export type DealStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'NEGOTIATING' | 'WON' | 'LOST';

export interface CreateDealPayload {
    title: string;
    clientId: string;
    notes?: string;
}

export interface UpdateDealPayload {
    name?: string;
    status?: DealStatus;
    notes?: string;
    briefTemplateId?: string;
    currentStep?: string;
}

export function useDeals() {
    const { activeWorkspace } = useAuth();
    const [deals, setDeals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const base = () => `/workspaces/${activeWorkspace?.id}/deals`;

    const fetchDeals = useCallback(async () => {
        if (!activeWorkspace) return;
        setIsLoading(true);
        try {
            const res = await api.get(base());
            setDeals(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeWorkspace]);

    const fetchDeal = useCallback(async (dealId: string) => {
        if (!activeWorkspace) return null;
        try {
            const res = await api.get(`${base()}/${dealId}`);
            return res.data;
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
            return null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeWorkspace]);

    const createDeal = useCallback(async (payload: CreateDealPayload) => {
        if (!activeWorkspace) {
            setError('Authentication required');
            return null;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.post(base(), payload);
            return res.data;
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeWorkspace]);

    const updateDeal = useCallback(async (dealId: string, payload: UpdateDealPayload) => {
        if (!activeWorkspace) return null;
        setIsLoading(true);
        try {
            const res = await api.patch(`${base()}/${dealId}`, payload);
            setDeals(prev => prev.map(d => d.id === dealId ? res.data : d));
            return res.data;
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeWorkspace]);

    const deleteDeal = useCallback(async (dealId: string) => {
        if (!activeWorkspace) return false;
        try {
            await api.delete(`${base()}/${dealId}`);
            setDeals(prev => prev.filter(d => d.id !== dealId));
            return true;
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
            return false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeWorkspace]);

    return {
        deals,
        fetchDeals,
        fetchDeal,
        createDeal,
        updateDeal,
        deleteDeal,
        isLoading,
        error,
    };
}
