import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DealStatus } from '../enums/deal-status.enum';

export class UpdateDealDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEnum(DealStatus)
    @IsOptional()
    status?: DealStatus;

    // Optional relation updates
    @IsString()
    @IsOptional()
    briefTemplateId?: string;

    @IsString()
    @IsOptional()
    currentStep?: string;
}
