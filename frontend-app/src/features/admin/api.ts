import api from '@/lib/api';
import { User } from '@/lib/types/api.types';

export const adminApi = {
    /**
     * Gets all users (Admin only)
     */
    getAllUsers: async (): Promise<User[]> => {
        const response = await api.get<User[]>('/users');
        return response.data;
    },

    /**
     * Upgrades a workspace plan manually (Admin only)
     */
    upgradeWorkspace: async (workspaceId: string, plan: 'pro' | 'premium'): Promise<{ success: boolean }> => {
        const response = await api.post<{ success: boolean }>(`/admin/workspaces/${workspaceId}/upgrade`, { plan });
        return response.data;
    },
};
