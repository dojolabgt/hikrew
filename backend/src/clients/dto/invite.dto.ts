import { IsString, MinLength, IsOptional } from 'class-validator';

export class AcceptInviteDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
