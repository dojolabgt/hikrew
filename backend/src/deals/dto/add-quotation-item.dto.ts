import { IsString, IsOptional, IsUUID, IsNumber, IsBoolean, IsEnum, Min } from 'class-validator';
import { ServiceChargeType, ServiceUnitType } from '../../services/service.entity';

export class AddQuotationItemDto {
    // If provided, we snapshot the service data. All other fields become optional.
    @IsUUID()
    @IsOptional()
    serviceId?: string;

    // Overridable fields (required if no serviceId)
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    price?: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    quantity?: number;

    @IsEnum(ServiceChargeType)
    @IsOptional()
    chargeType?: ServiceChargeType;

    @IsEnum(ServiceUnitType)
    @IsOptional()
    unitType?: ServiceUnitType;

    @IsBoolean()
    @IsOptional()
    isTaxable?: boolean;

    @IsNumber()
    @IsOptional()
    @Min(0)
    discount?: number;
}
