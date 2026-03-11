import { IsEmail, IsNotEmpty } from 'class-validator';

export class InviteConnectionDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
