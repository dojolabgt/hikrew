import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, ValidateNested, IsArray, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMilestoneDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    percentage?: number;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString()
    @IsOptional()
    dueDate?: string;
}

export class CreatePaymentPlanDto {
    @IsUUID()
    @IsOptional()
    quotationId?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateMilestoneDto)
    milestones: CreateMilestoneDto[];
}

export class UpdateMilestoneDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    percentage?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    amount?: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString()
    @IsOptional()
    dueDate?: string;
}
