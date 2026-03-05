

export enum ServiceUnitType {
    HOUR = 'HOUR',
    PROJECT = 'PROJECT',
    MONTH = 'MONTH',
    UNIT = 'UNIT',
}

export enum ServiceChargeType {
    ONE_TIME = 'ONE_TIME',
    HOURLY = 'HOURLY',
    RECURRING = 'RECURRING',
}

export interface Service {
    id: string;
    workspaceId: string;
    name: string;
    sku?: string;
    description?: string;
    basePrice: number;
    currency: string;
    unitType: ServiceUnitType;
    chargeType: ServiceChargeType;
    internalCost: number;
    isTaxable: boolean;
    imageUrl?: string;
    estimatedDeliveryDays?: number;
    specificTerms?: string;
    metadata?: Record<string, any>;
    category?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateServiceDto {
    name: string;
    sku?: string;
    description?: string;
    basePrice: number;
    currency: string;
    unitType?: ServiceUnitType;
    chargeType?: ServiceChargeType;
    internalCost?: number;
    isTaxable?: boolean;
    imageUrl?: string;
    estimatedDeliveryDays?: number;
    specificTerms?: string;
    metadata?: Record<string, any>;
    category?: string;
}

export interface UpdateServiceDto extends Partial<CreateServiceDto> {
    isActive?: boolean;
}
