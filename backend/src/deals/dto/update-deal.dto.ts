import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DealStatus } from '../enums/deal-status.enum';

export class UpdateDealDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(DealStatus)
  @IsOptional()
  status?: DealStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  briefTemplateId?: string;

  @IsString()
  @IsOptional()
  currentStep?: string;

  @IsString()
  @IsOptional()
  proposalIntro?: string;

  @IsString()
  @IsOptional()
  proposalTerms?: string;

  @IsOptional()
  validUntil?: Date;
}
