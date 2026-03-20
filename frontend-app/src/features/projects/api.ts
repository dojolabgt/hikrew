import api from '@/lib/api';
import { PaginatedResponse, ListQuery, toQueryString } from '@/types/pagination';
import { Project } from '@/hooks/use-projects';

export interface CreateProjectPayload {
    name: string;
    description?: string;
    clientId?: string;
    currency?: string;
    budget?: number;
}

export interface UpdateProjectPayload {
    name?: string;
    description?: string;
    status?: string;
    currency?: string;
    budget?: number | null;
}

export const projectsApi = {
    getAll: async (
        workspaceId: string,
        query?: Partial<ListQuery>,
    ): Promise<PaginatedResponse<Project>> => {
        const qs = query ? toQueryString({ page: 1, limit: 20, ...query }) : '';
        return api
            .get(`/workspaces/${workspaceId}/projects${qs ? `?${qs}` : ''}`)
            .then((res) => res.data);
    },

    create: async (workspaceId: string, dto: CreateProjectPayload): Promise<Project> => {
        return api
            .post(`/workspaces/${workspaceId}/projects`, dto)
            .then((res) => res.data);
    },

    update: async (workspaceId: string, projectId: string, dto: UpdateProjectPayload): Promise<Project> => {
        return api
            .patch(`/workspaces/${workspaceId}/projects/${projectId}`, dto)
            .then((res) => res.data);
    },

    createBrief: async (
        workspaceId: string,
        projectId: string,
        dto: { name: string; templateId?: string; responses?: Record<string, unknown> },
    ) => {
        return api
            .post(`/workspaces/${workspaceId}/projects/${projectId}/briefs`, dto)
            .then((res) => res.data);
    },

    updateBrief: async (
        workspaceId: string,
        projectId: string,
        briefId: string,
        dto: { name?: string; responses?: Record<string, unknown>; isCompleted?: boolean },
    ) => {
        return api
            .patch(`/workspaces/${workspaceId}/projects/${projectId}/briefs/${briefId}`, dto)
            .then((res) => res.data);
    },

    deleteBrief: async (workspaceId: string, projectId: string, briefId: string) => {
        return api
            .delete(`/workspaces/${workspaceId}/projects/${projectId}/briefs/${briefId}`)
            .then((res) => res.data);
    },

    getPaymentPlan: async (workspaceId: string, projectId: string) => {
        return api
            .get(`/workspaces/${workspaceId}/projects/${projectId}/payment-plan`)
            .then((res) => res.data);
    },

    createOrUpdatePaymentPlan: async (
        workspaceId: string,
        projectId: string,
        dto: {
            milestones: { name: string; amount: number; percentage?: number; dueDate?: string; description?: string }[];
            billingCycle?: string;
        },
    ) => {
        return api
            .post(`/workspaces/${workspaceId}/projects/${projectId}/payment-plan`, dto)
            .then((res) => res.data);
    },

    addMilestone: async (
        workspaceId: string,
        projectId: string,
        dto: { name: string; amount: number; percentage?: number; dueDate?: string; description?: string },
    ) => {
        return api
            .post(`/workspaces/${workspaceId}/projects/${projectId}/payment-plan/milestones`, dto)
            .then((res) => res.data);
    },

    updateMilestone: async (
        workspaceId: string,
        projectId: string,
        milestoneId: string,
        dto: { name?: string; amount?: number; status?: string; dueDate?: string },
    ) => {
        return api
            .patch(
                `/workspaces/${workspaceId}/projects/${projectId}/payment-plan/milestones/${milestoneId}`,
                dto,
            )
            .then((res) => res.data);
    },

    deleteMilestone: async (workspaceId: string, projectId: string, milestoneId: string) => {
        return api
            .delete(
                `/workspaces/${workspaceId}/projects/${projectId}/payment-plan/milestones/${milestoneId}`,
            )
            .then((res) => res.data);
    },

    updatePaymentSettings: async (
        workspaceId: string,
        projectId: string,
        dto: { billingCycle?: string },
    ) => {
        return api
            .patch(`/workspaces/${workspaceId}/projects/${projectId}/payment-plan/settings`, dto)
            .then((res) => res.data);
    },
};
