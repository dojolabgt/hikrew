import api from '@/lib/auth';

export interface UserProfile {
    id: number;
    email: string;
    name: string;
    role: string;
    avatar?: string;
}

export interface UpdateProfileDto {
    name?: string;
    email?: string;
    avatar?: string;
}

export interface PasswordChangeDto {
    currentPassword?: string;
    newPassword?: string;
}

/**
 * Update user profile information
 */
export const updateProfile = async (data: UpdateProfileDto): Promise<UserProfile> => {
    const response = await api.patch<UserProfile>('/users/profile', data);
    return response.data;
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{ avatarUrl: string }>('/users/profile/avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

/**
 * Change user password
 */
export const changePassword = async (data: PasswordChangeDto): Promise<void> => {
    await api.post('/users/change-password', data);
};
