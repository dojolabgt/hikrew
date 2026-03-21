import api from '@/lib/api';
import type { Workspace } from './types';
import type { DriveFile } from '@/features/projects/driveApi';

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

    getGoogleDriveStatus: () =>
        api.get<{ connected: boolean; email?: string; rootFolderId?: string; rootFolderName?: string }>(
            '/workspaces/current/google-drive/status',
        ).then(res => res.data),

    getGoogleDriveAuthUrl: () =>
        api.get<{ url: string }>('/workspaces/current/google-drive/auth-url').then(res => res.data),

    setupDriveFolder: (folderName: string) =>
        api.post<{ folderId: string; folderName: string }>(
            '/workspaces/current/google-drive/setup-folder',
            { folderName },
        ).then(res => res.data),

    disconnectGoogleDrive: () =>
        api.delete('/workspaces/current/google-drive').then(res => res.data),

    getDriveFiles: (folderId?: string) =>
        api.get<DriveFile[]>('/workspaces/current/google-drive/files', {
            params: folderId ? { folderId } : undefined,
        }).then(res => res.data),

    uploadDriveFile: async (file: File): Promise<DriveFile> => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<DriveFile>('/workspaces/current/google-drive/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(res => res.data);
    },

    deleteDriveFile: (fileId: string): Promise<void> =>
        api.delete(`/workspaces/current/google-drive/files/${fileId}`).then(res => res.data),
};
