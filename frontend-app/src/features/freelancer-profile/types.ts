export interface FreelancerProfile {
    id: string;
    userId: string;
    businessName: string | null;
    logo: string | null;
    brandColor: string | null;
    // Las claves no se devuelven en texto plano por seguridad.
    plan: 'free' | 'pro' | 'premium';
    planExpiresAt: string | null;
    quotesThisMonth: number;
    quotesMonthReset: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateFreelancerProfileDto {
    businessName?: string;
    logo?: string;
    brandColor?: string;
}

export interface UpdateRecurrenteKeysDto {
    publicKey: string;
    privateKey: string;
}

export interface RecurrenteStatus {
    configured: boolean;
}
