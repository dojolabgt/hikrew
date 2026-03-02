import api from '@/lib/api';
import { Service, CreateServiceDto, UpdateServiceDto } from './types';

export const servicesApi = {
    getAll: async (): Promise<Service[]> => {
        return api.get('/services').then(res => res.data);
    },

    getOne: async (id: string): Promise<Service> => {
        return api.get(`/services/${id}`).then(res => res.data);
    },

    create: async (dto: CreateServiceDto): Promise<Service> => {
        return api.post('/services', dto).then(res => res.data);
    },

    update: async (id: string, dto: UpdateServiceDto): Promise<Service> => {
        return api.patch(`/services/${id}`, dto).then(res => res.data);
    },

    delete: async (id: string): Promise<void> => {
        return api.delete(`/services/${id}`).then(res => res.data);
    },
};
