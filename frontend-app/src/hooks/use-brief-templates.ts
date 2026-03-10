import { useState, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import api from '@/lib/api';

export interface BriefTemplate {
    id: string;
    name: string;
    description?: string;
    schema: any[];
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateBriefTemplatePayload {
    name: string;
    description?: string;
    schema?: any[];
    isActive?: boolean;
}

export function useBriefTemplates() {
    const { activeWorkspace } = useAuth();
    const [templates, setTemplates] = useState<BriefTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTemplates = useCallback(async () => {
        if (!activeWorkspace) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get(`/workspaces/${activeWorkspace.id}/deals/brief-templates`);
            setTemplates(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setIsLoading(false);
        }
    }, [activeWorkspace]);

    const createTemplate = useCallback(async (payload: CreateBriefTemplatePayload) => {
        if (!activeWorkspace) return null;
        setIsLoading(true);
        try {
            const res = await api.post(`/workspaces/${activeWorkspace.id}/deals/brief-templates`, payload);
            const newTemplate = res.data;
            setTemplates(prev => [newTemplate, ...prev]);
            return newTemplate;
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [activeWorkspace]);

    const updateTemplate = useCallback(async (id: string, payload: Partial<CreateBriefTemplatePayload>) => {
        if (!activeWorkspace) return null;
        setIsLoading(true);
        try {
            const res = await api.patch(`/workspaces/${activeWorkspace.id}/deals/brief-templates/${id}`, payload);
            const updated = res.data;
            setTemplates(prev => prev.map(t => t.id === id ? updated : t));
            return updated;
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [activeWorkspace]);

    return {
        templates,
        isLoading,
        error,
        fetchTemplates,
        createTemplate,
        updateTemplate
    };
}
