import api from '@/lib/api';
import { Client, CreateClientDto, UpdateClientDto } from './types';

export const clientsApi = {
    getAll: async (): Promise<Client[]> => {
        return api.get('/clients').then(res => res.data);
    },

    getOne: async (id: string): Promise<Client> => {
        return api.get(`/clients/${id}`).then(res => res.data);
    },

    create: async (dto: CreateClientDto): Promise<Client> => {
        return api.post('/clients', dto).then(res => res.data);
    },

    update: async (id: string, dto: UpdateClientDto): Promise<Client> => {
        return api.patch(`/clients/${id}`, dto).then(res => res.data);
    },

    delete: async (id: string): Promise<void> => {
        return api.delete(`/clients/${id}`).then(res => res.data);
    },
};
