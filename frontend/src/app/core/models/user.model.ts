import { UserRole } from './auth.model';

export interface ManagedUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  banned: boolean;
  bannedUntil: string | null;
  banReason: string | null;
  bannedAt: string | null;
  banRunId: string | null;
}

export interface BanUserDto {
  durationDays?: number;
  reason?: string;
  runId?: string;
}
