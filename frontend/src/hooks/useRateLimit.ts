import { useState, useCallback, useRef } from 'react';

interface RateLimitOptions {
    maxAttempts: number;
    windowMs: number;
    blockDurationMs?: number;
}

interface RateLimitState {
    attempts: number;
    isBlocked: boolean;
    blockedUntil: number | null;
    canAttempt: () => boolean;
    recordAttempt: () => void;
    reset: () => void;
    getRemainingTime: () => number;
}

/**
 * Hook for rate limiting actions (e.g., login attempts)
 * 
 * @param options - Configuration for rate limiting
 * @returns Rate limit state and control functions
 * 
 * @example
 * const rateLimit = useRateLimit({
 *   maxAttempts: 5,
 *   windowMs: 60000, // 1 minute
 *   blockDurationMs: 300000, // 5 minutes
 * });
 * 
 * const handleLogin = async () => {
 *   if (!rateLimit.canAttempt()) {
 *     const remaining = rateLimit.getRemainingTime();
 *     toast.error(`Demasiados intentos. Espera ${Math.ceil(remaining / 1000)}s`);
 *     return;
 *   }
 *   
 *   try {
 *     await login();
 *     rateLimit.reset();
 *   } catch (error) {
 *     rateLimit.recordAttempt();
 *   }
 * };
 */
export function useRateLimit(options: RateLimitOptions): RateLimitState {
    const { maxAttempts, windowMs, blockDurationMs = windowMs * 5 } = options;

    const [attempts, setAttempts] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockedUntil, setBlockedUntil] = useState<number | null>(null);

    const attemptsRef = useRef<number[]>([]);

    const canAttempt = useCallback((): boolean => {
        const now = Date.now();

        // Check if currently blocked
        if (blockedUntil && now < blockedUntil) {
            return false;
        }

        // Unblock if time has passed
        if (blockedUntil && now >= blockedUntil) {
            setIsBlocked(false);
            setBlockedUntil(null);
            setAttempts(0);
            attemptsRef.current = [];
            return true;
        }

        // Filter out attempts outside the time window
        attemptsRef.current = attemptsRef.current.filter(
            timestamp => now - timestamp < windowMs
        );

        return attemptsRef.current.length < maxAttempts;
    }, [blockedUntil, maxAttempts, windowMs]);

    const recordAttempt = useCallback(() => {
        const now = Date.now();
        attemptsRef.current.push(now);

        // Filter attempts within window
        attemptsRef.current = attemptsRef.current.filter(
            timestamp => now - timestamp < windowMs
        );

        const currentAttempts = attemptsRef.current.length;
        setAttempts(currentAttempts);

        // Block if max attempts reached
        if (currentAttempts >= maxAttempts) {
            const blockUntil = now + blockDurationMs;
            setIsBlocked(true);
            setBlockedUntil(blockUntil);
        }
    }, [maxAttempts, windowMs, blockDurationMs]);

    const reset = useCallback(() => {
        setAttempts(0);
        setIsBlocked(false);
        setBlockedUntil(null);
        attemptsRef.current = [];
    }, []);

    const getRemainingTime = useCallback((): number => {
        if (!blockedUntil) return 0;
        const remaining = blockedUntil - Date.now();
        return Math.max(0, remaining);
    }, [blockedUntil]);

    return {
        attempts,
        isBlocked,
        blockedUntil,
        canAttempt,
        recordAttempt,
        reset,
        getRemainingTime,
    };
}
