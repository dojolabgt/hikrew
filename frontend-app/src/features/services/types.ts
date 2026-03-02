export enum ServiceCurrency {
    GTQ = 'GTQ',
    USD = 'USD',
}

export interface Service {
    id: string;
    workspaceId: string;
    name: string;
    description?: string;
    defaultPrice: number;
    currency: ServiceCurrency;
    category?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateServiceDto {
    name: string;
    description?: string;
    defaultPrice: number;
    currency: ServiceCurrency;
    category?: string;
}

export interface UpdateServiceDto extends Partial<CreateServiceDto> {
    isActive?: boolean;
}
