export type UserRole = 'user' | 'admin';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  banned: boolean;
  banReason?: string | null;
  bannedUntil?: string | null;
  bannedAt?: string | null;
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
