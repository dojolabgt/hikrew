import api from '@/lib/api';

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink: string;
    size?: string;
    createdTime: string;
    iconLink?: string;
    thumbnailLink?: string;
}

export interface DriveFolder {
    folderId: string;
    folderUrl: string;
}

export const projectDriveApi = {
    createFolder: (projectId: string): Promise<DriveFolder> =>
        api.post<DriveFolder>(`/projects/${projectId}/drive/folder`).then(res => res.data),

    getFiles: (projectId: string): Promise<DriveFile[]> =>
        api.get<DriveFile[]>(`/projects/${projectId}/drive/files`).then(res => res.data),

    uploadFile: async (projectId: string, file: File): Promise<DriveFile> => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<DriveFile>(`/projects/${projectId}/drive/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(res => res.data);
    },

    deleteFile: (projectId: string, fileId: string): Promise<void> =>
        api.delete(`/projects/${projectId}/drive/files/${fileId}`).then(res => res.data),
};
