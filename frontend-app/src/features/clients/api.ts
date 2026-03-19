import api from '@/lib/api';
import { Client, CreateClientDto, UpdateClientDto } from './types';
import { PaginatedResponse, ListQuery, toQueryString } from '@/types/pagination';

export const clientsApi = {
    getAll: async (query?: Partial<ListQuery>): Promise<PaginatedResponse<Client>> => {
        const qs = query ? toQueryString({ page: 1, limit: 20, ...query }) : '';
        return api.get(`/clients${qs ? `?${qs}` : ''}`).then((res) => res.data);
    },

    getOne: async (id: string): Promise<Client> => {
        return api.get(`/clients/${id}`).then((res) => res.data);
    },

    create: async (dto: CreateClientDto): Promise<Client> => {
        return api.post('/clients', dto).then((res) => res.data);
    },

    update: async (id: string, dto: UpdateClientDto): Promise<Client> => {
        return api.patch(`/clients/${id}`, dto).then((res) => res.data);
    },

    delete: async (id: string): Promise<void> => {
        return api.delete(`/clients/${id}`).then((res) => res.data);
    },

    inviteToPortal: async (id: string): Promise<void> => {
        return api.post(`/clients/${id}/invite`).then((res) => res.data);
    },

    getInvite: async (token: string): Promise<{
        clientName: string;
        email: string;
        hasAccount: boolean;
        hasPassword: boolean;
        workspace: { businessName?: string; logo?: string };
    }> => {
        return api.get(`/clients/invite/${token}`).then((res) => res.data);
    },

    acceptInvite: async (token: string, password: string): Promise<void> => {
        return api.post(`/clients/invite/${token}/accept`, { password }).then((res) => res.data);
    },
};
