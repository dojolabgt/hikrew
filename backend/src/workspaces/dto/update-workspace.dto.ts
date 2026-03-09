import { IsOptional, IsString, IsIn, IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CurrencyEntryDto {
    @IsString()
    code: string;

    @IsString()
    name: string;

    @IsString()
    symbol: string;

    @IsBoolean()
    isDefault: boolean;
}

export class UpdateWorkspaceDto {
    @IsOptional()
    @IsString()
    businessName?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    useCases?: string[];

    @IsOptional()
    @IsBoolean()
    onboardingCompleted?: boolean;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    taxId?: string;

    @IsOptional()
    @IsString()
    @IsIn(['en', 'es', 'en-US', 'es-419'], { message: 'Idioma no válido' })
    language?: string;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsString()
    dateFormat?: string;

    @IsOptional()
    @IsString()
    timeFormat?: string;

    @IsOptional()
    @IsString()
    numberFormat?: string;

    @IsOptional()
    @IsString()
    currencyFormat?: string;

    @IsOptional()
    @IsString()
    firstDayOfWeek?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CurrencyEntryDto)
    currencies?: CurrencyEntryDto[];

    @IsOptional()
    @IsBoolean()
    taxInclusivePricing?: boolean;

    @IsOptional()
    @IsString()
    taxInclusiveLabel?: string;
}
