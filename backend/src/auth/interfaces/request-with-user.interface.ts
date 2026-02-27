import { Request } from 'express';
import { AuthenticatedUser } from './authenticated-user.interface';

export interface RequestWithCookies extends Request {
  cookies: {
    Refresh?: string;
    Authentication?: string;
    [key: string]: string | undefined;
  };
}

export interface RequestWithUser extends RequestWithCookies {
  user: AuthenticatedUser;
}
