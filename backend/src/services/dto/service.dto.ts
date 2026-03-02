import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { ServiceCurrency } from '../service.entity';

export class CreateServiceDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
    defaultPrice: number;

    @IsEnum(ServiceCurrency)
    currency: ServiceCurrency;

    @IsOptional()
    @IsString()
    category?: string;
}

export class UpdateServiceDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    defaultPrice?: number;

    @IsOptional()
    @IsEnum(ServiceCurrency)
    currency?: ServiceCurrency;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
