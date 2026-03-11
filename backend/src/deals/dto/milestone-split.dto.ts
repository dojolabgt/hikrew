import { IsNumber, IsOptional, IsUUID, Min, Max } from 'class-validator';

export class CreateMilestoneSplitDto {
  @IsUUID()
  collaboratorWorkspaceId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsNumber()
  @Min(0)
  amount: number;
}
