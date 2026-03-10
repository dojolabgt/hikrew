import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateDealDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
