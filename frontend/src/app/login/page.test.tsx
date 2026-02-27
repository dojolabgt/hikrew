import { render, screen, waitFor } from '@testing-library/react';
import LoginPage from './page';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
    }),
}));

// Mock child components to avoid complex rendering logic in unit test
vi.mock('@/components/login-form', () => ({
    LoginForm: ({ onSuccess }: { onSuccess: () => void }) => (
        <button data-testid="login-form-submit" onClick={onSuccess}>
            Mock Login Form
        </button>
    ),
}));

vi.mock('@/components/common/AppBranding', () => ({
    AppBranding: () => <div data-testid="app-branding">App Branding</div>,
}));

vi.mock('@/features/app-settings/services/settings-service', () => ({
    getSettings: vi.fn().mockResolvedValue({}),
}));

describe('LoginPage', () => {
    const mockValues = {
        user: null,
        isLoading: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as Mock).mockReturnValue(mockValues);
    });

    it('should render login page structure', async () => {
        render(<LoginPage />);
        expect(screen.getByText('Acceso Corporativo')).toBeDefined();
        expect(screen.getByTestId('app-branding')).toBeDefined();
        expect(screen.getByText('Clientes')).toBeDefined();
    });

    it('should redirect if user is authenticated', async () => {
        (useAuth as Mock).mockReturnValue({
            user: { id: '1', email: 'test@test.com' },
            isLoading: false,
        });

        // Test that the component actually calls the hook which calls useRouter
        // Since we mocked useRouter at the top, we need to inspect the mock
        const useRouter = (await import('next/navigation')).useRouter;
        const { replace } = useRouter();

        render(<LoginPage />);

        await waitFor(() => {
            expect(replace).toHaveBeenCalledWith('/dashboard');
        });
    });
});
