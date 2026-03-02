import api from '@/lib/api';
import type { Workspace } from './types';

export const workspacesApi = {
    getMyWorkspaces: () =>
        api.get<Workspace[]>('/workspaces/my-workspaces').then(res => res.data),

    updateWorkspace: (data: Partial<Workspace>) =>
        api.patch<Workspace>(`/workspaces/current`, data).then(res => res.data),

    uploadLogo: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<Workspace>(`/workspaces/current/logo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(res => res.data);
    },

    getRecurrenteStatus: () =>
        api.get<{ configured: boolean }>(`/workspaces/current/recurrente/status`).then(res => res.data),

    updateRecurrenteKeys: (data: { publicKey: string, privateKey: string }) =>
        api.post<void>(`/workspaces/current/recurrente`, data).then(res => res.data),
};
