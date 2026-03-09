import { IsString, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';

export class UpdateQuotationDto {
    @IsString()
    @IsOptional()
    optionName?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    discount?: number;

    @IsBoolean()
    @IsOptional()
    isApproved?: boolean;
}
