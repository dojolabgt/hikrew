import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth, AuthProvider } from '@/contexts/auth-context';
import * as authLib from '@/lib/auth';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { User } from '@/lib/types/api.types';

describe('useAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
    );

    it('should initialize with loading state', async () => {
        (authLib.checkAuth as Mock).mockReturnValue(new Promise(() => { }));
        const { result } = renderHook(() => useAuth(), { wrapper });
        expect(result.current.isLoading).toBe(true);
    });

    it('should set user if checkAuth succeeds', async () => {
        const mockUser: User = {
            id: '1',
            email: 'test@test.com',
            name: 'Test',
            role: 'client',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        (authLib.checkAuth as Mock).mockResolvedValue(mockUser);

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.user).toEqual(mockUser);
    });

    it('should set user to null if checkAuth fails', async () => {
        (authLib.checkAuth as Mock).mockRejectedValue(new Error('Unauthorized'));

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.user).toBeNull();
    });

    it('should handle login success', async () => {
        const mockUser: User = {
            id: '1',
            email: 'test@test.com',
            name: 'Test',
            role: 'client',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        // Setup initial state (not logged in)
        (authLib.checkAuth as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Act
        await act(async () => {
            await result.current.login(mockUser);
        });

        expect(result.current.user).toEqual(mockUser);
    });

    it('should handle logout', async () => {
        const mockUser: User = {
            id: '1',
            email: 'test@test.com',
            name: 'Test',
            role: 'client',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        (authLib.checkAuth as Mock).mockResolvedValue(mockUser);

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.logout();
        });

        expect(authLib.logout).toHaveBeenCalled();
        expect(result.current.user).toBeNull();
    });
});