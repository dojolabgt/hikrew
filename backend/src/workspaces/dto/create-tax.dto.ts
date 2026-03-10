import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsOptional,
  IsBoolean,
  IsInt,
} from 'class-validator';
import type { TaxAppliesTo } from '../workspace-tax.entity';

export class CreateTaxDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  rate: number;

  @IsIn(['all', 'services', 'products'])
  @IsOptional()
  appliesTo?: TaxAppliesTo;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  order?: number;
}
