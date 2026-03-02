import api from '@/lib/api';
import {
    FreelancerProfile,
    UpdateFreelancerProfileDto,
    UpdateRecurrenteKeysDto,
    RecurrenteStatus
} from './types';

export const freelancerProfileApi = {
    /**
     * Obtiene el perfil del freelancer autenticado
     */
    getProfile: async (): Promise<FreelancerProfile> => {
        const response = await api.get<FreelancerProfile>('/me/profile');
        return response.data;
    },

    /**
     * Actualiza el perfil del freelancer autenticado
     */
    updateProfile: async (data: UpdateFreelancerProfileDto): Promise<FreelancerProfile> => {
        const response = await api.patch<FreelancerProfile>('/me/profile', data);
        return response.data;
    },

    /**
     * Actualiza las claves de Recurrente (encriptadas en el backend)
     */
    updateRecurrenteKeys: async (data: UpdateRecurrenteKeysDto): Promise<void> => {
        await api.patch<void>('/me/recurrente-keys', data);
    },

    /**
     * Obtiene el estado de configuración de Recurrente
     */
    getRecurrenteStatus: async (): Promise<RecurrenteStatus> => {
        const response = await api.get<RecurrenteStatus>('/me/recurrente-status');
        return response.data;
    },

    /**
     * Sube un archivo de imagen como logo del negocio
     */
    uploadLogo: async (file: File): Promise<FreelancerProfile> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<FreelancerProfile>('/me/profile/logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
};
