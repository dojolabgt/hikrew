import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsInt,
  IsObject,
} from 'class-validator';
import { ServiceUnitType, ServiceChargeType } from '../service.entity';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  basePrice: number;

  @IsString()
  currency: string;

  @IsOptional()
  @IsEnum(ServiceUnitType)
  unitType?: ServiceUnitType;

  @IsOptional()
  @IsEnum(ServiceChargeType)
  chargeType?: ServiceChargeType;

  @IsOptional()
  @IsNumber()
  internalCost?: number;

  @IsOptional()
  @IsBoolean()
  isTaxable?: boolean;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  estimatedDeliveryDays?: number;

  @IsOptional()
  @IsString()
  specificTerms?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

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
  sku?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(ServiceUnitType)
  unitType?: ServiceUnitType;

  @IsOptional()
  @IsEnum(ServiceChargeType)
  chargeType?: ServiceChargeType;

  @IsOptional()
  @IsNumber()
  internalCost?: number;

  @IsOptional()
  @IsBoolean()
  isTaxable?: boolean;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  estimatedDeliveryDays?: number;

  @IsOptional()
  @IsString()
  specificTerms?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
