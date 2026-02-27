import { z } from 'zod';

/**
 * Environment variable validation schema
 * This ensures all required environment variables are present and valid at build time
 */
const envSchema = z.object({
    NEXT_PUBLIC_API_URL: z.string().url({
        message: 'NEXT_PUBLIC_API_URL must be a valid URL (e.g., http://localhost:4000)',
    }),
    NEXT_PUBLIC_IMAGE_BACKEND_URL: z.string().min(1, {
        message: 'NEXT_PUBLIC_IMAGE_BACKEND_URL is required',
    }),
});

/**
 * Validate and parse environment variables
 * Throws an error if validation fails, preventing the app from building/running with invalid config
 */
function validateEnv() {
    try {
        return envSchema.parse({
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
            NEXT_PUBLIC_IMAGE_BACKEND_URL: process.env.NEXT_PUBLIC_IMAGE_BACKEND_URL,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.issues
                .map((err: z.ZodIssue) => `  - ${err.path.join('.')}: ${err.message}`)
                .join('\n');

            throw new Error(
                `❌ Invalid environment variables:\n${errorMessages}\n\nPlease check your .env file and ensure all required variables are set correctly.`
            );
        }
        throw error;
    }
}

/**
 * Validated and typed environment configuration
 * Use this instead of process.env to ensure type safety and validation
 */
export const env = validateEnv();

/**
 * Type-safe environment configuration object
 * Provides autocomplete and type checking for environment variables
 */
export const config = {
    apiUrl: env.NEXT_PUBLIC_API_URL,
    imageBackendUrl: env.NEXT_PUBLIC_IMAGE_BACKEND_URL,
} as const;
