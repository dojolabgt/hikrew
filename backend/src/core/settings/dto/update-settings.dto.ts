import {
  IsString,
  IsOptional,
  IsBoolean,
  IsHexColor,
  MaxLength,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  appName?: string;

  @IsOptional()
  @IsString()
  appLogo?: string;

  @IsOptional()
  @IsString()
  appFavicon?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @IsOptional()
  @IsBoolean()
  allowRegistration?: boolean;

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;
}
