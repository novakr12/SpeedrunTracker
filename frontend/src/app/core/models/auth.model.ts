import { AppealStatus } from './appeal.model';

export type UserRole = 'user' | 'admin';

export interface AuthUserAppeal {
  status: AppealStatus;
  message: string;
  adminComment: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  banned: boolean;
  banReason?: string | null;
  bannedUntil?: string | null;
  bannedAt?: string | null;
  canAppeal?: boolean;
  appeal?: AuthUserAppeal | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}
