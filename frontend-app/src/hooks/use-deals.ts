import { useState, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import api from '@/lib/api';

export interface CreateDealPayload {
    title: string;
    clientId: string;
    notes?: string;
}

export interface UpdateDealPayload {
    name?: string;
    status?: 'draft' | 'pending' | 'won' | 'lost';
    briefTemplateId?: string;
    currentStep?: string;
}

export function useDeals() {
    const { activeWorkspace } = useAuth();
    const [deals, setDeals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDeals = useCallback(async () => {
        if (!activeWorkspace) return;
        setIsLoading(true);
        try {
            const res = await api.get(`/workspaces/${activeWorkspace.id}/deals`);
            setDeals(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setIsLoading(false);
        }
    }, [activeWorkspace]);

    const createDeal = useCallback(async (payload: CreateDealPayload) => {
        if (!activeWorkspace) {
            setError('Authentication required');
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await api.post(`/workspaces/${activeWorkspace.id}/deals`, payload);
            return res.data;
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [activeWorkspace]);

    const updateDeal = useCallback(async (dealId: string, payload: UpdateDealPayload) => {
        if (!activeWorkspace) return null;
        setIsLoading(true);
        try {
            const res = await api.patch(`/workspaces/${activeWorkspace.id}/deals/${dealId}`, payload);
            setDeals((prev) => prev.map((d) => d.id === dealId ? res.data : d));
            return res.data;
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [activeWorkspace]);

    const deleteDeal = useCallback(async (dealId: string) => {
        if (!activeWorkspace) return false;
        try {
            await api.delete(`/workspaces/${activeWorkspace.id}/deals/${dealId}`);
            setDeals((prev) => prev.filter((d) => d.id !== dealId));
            return true;
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
            return false;
        }
    }, [activeWorkspace]);

    return {
        deals,
        fetchDeals,
        createDeal,
        updateDeal,
        deleteDeal,
        isLoading,
        error
    };
}
