import { IsString, IsOptional } from 'class-validator';

export class CreateQuotationDto {
  @IsString()
  @IsOptional()
  optionName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  currency?: string;
}
