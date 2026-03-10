import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';

export class UpdateQuotationDto {
  @IsString()
  @IsOptional()
  optionName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;
}
